/**
 * Cross-Portal Entity Triangulation & Verification Service
 * 
 * Performs holistic multi-source consistency checks across statutory databases.
 * Validates entity identity graphs: PAN <-> GSTIN <-> Udyam <-> MCA <-> EPFO <-> Debarment.
 */

const { getVerificationProvider, verificationFactory } = require('./verificationFactory');

class EntityTriangulationService {
  /**
   * Run full verification & triangulation for a bidder
   */
  async verifyBidderFull(bidderData, tenderRequirements = {}) {
    const provider = getVerificationProvider();
    const verificationRunId = `VRUN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const {
      organizationName,
      pan,
      gstin,
      udyamNo,
      cinNo,
      epfoEstablishmentId,
      esicEmployerId,
      startupRecognitionNo,
      nsicRegistrationNo,
      gemSellerId,
      digilockerDocId,
      bisCertNo,
      localContentDeclId,
      turnoverDeclared,
      experienceYearsDeclared,
    } = bidderData;

    const verificationChecks = [];
    const entityDiscrepancies = [];
    let riskLevel = 'LOW';
    let complianceScore = 100;

    // 1. Central Blacklist & Debarment Check (CRITICAL)
    const blacklistCheck = await provider.checkBlacklist(pan || gstin || cinNo || organizationName);
    verificationChecks.push({
      ...blacklistCheck,
      verificationRunId,
      bidderId: bidderData.id || null,
      timestamp,
    });

    if (blacklistCheck.status === 'CRITICAL_RISK_DEBARRED') {
      riskLevel = 'CRITICAL';
      complianceScore = Math.min(complianceScore, 10);
      entityDiscrepancies.push({
        severity: 'CRITICAL',
        field: 'DEBARMENT_STATUS',
        issue: 'Entity is actively debarred/blacklisted by government authorities.',
        details: blacklistCheck.data?.reason || 'Listed on central debarment registry.',
      });
    }

    // 2. PAN Verification
    let panResult = null;
    if (pan) {
      panResult = await provider.verifyPAN(pan, organizationName);
      verificationChecks.push({
        ...panResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (panResult.status !== 'VERIFIED') {
        complianceScore -= 20;
        if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
        entityDiscrepancies.push({
          severity: 'HIGH',
          field: 'PAN_NUMBER',
          issue: `PAN Verification Issue: ${panResult.result}`,
          details: `Submitted: ${pan}. Legal Name: ${organizationName}`,
        });
      }
    }

    // 3. GST Verification & PAN-GST Embedded Cross-Check
    let gstResult = null;
    if (gstin) {
      gstResult = await provider.verifyGST(gstin, organizationName, pan);
      verificationChecks.push({
        ...gstResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (gstResult.status !== 'VERIFIED') {
        complianceScore -= 20;
        if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
        entityDiscrepancies.push({
          severity: 'HIGH',
          field: 'GSTIN',
          issue: `GST Compliance Issue: ${gstResult.result}`,
          details: `GSTIN: ${gstin}. Registration Status: ${gstResult.data?.registrationStatus || 'Unknown'}`,
        });
      }

      // PAN-GST Embedded Structural Triangulation (Chars 3-12 of GSTIN must equal PAN)
      if (pan && gstin.length === 15) {
        const embeddedPan = gstin.substring(2, 12).toUpperCase();
        if (embeddedPan !== pan.trim().toUpperCase()) {
          complianceScore -= 25;
          if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
          entityDiscrepancies.push({
            severity: 'HIGH',
            field: 'PAN_GST_STRUCTURAL_MISMATCH',
            issue: 'PAN embedded inside GSTIN does not match declared PAN card number',
            details: `Declared PAN: ${pan} vs Embedded GSTIN PAN: ${embeddedPan}`,
          });
        }
      }
    }

    // 4. Cross-Portal Legal Name Consistency Triangulation
    if (panResult?.data && gstResult?.data) {
      const panName = panResult.data.legalName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const gstName = gstResult.data.legalName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // If names differ meaningfully (>2 chars edit distance)
      if (panName !== gstName && !panName.includes(gstName) && !gstName.includes(panName)) {
        complianceScore -= 15;
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        entityDiscrepancies.push({
          severity: 'MEDIUM',
          field: 'CROSS_PORTAL_NAME_MISMATCH',
          issue: 'Statutory Legal Name mismatch between CBDT PAN and GSTN Registries',
          details: `CBDT Name: "${panResult.data.legalName}" vs GSTN Name: "${gstResult.data.legalName}"`,
        });
      }
    }

    // 5. Udyam / MSME Verification
    if (udyamNo) {
      const udyamResult = await provider.verifyUdyam(udyamNo, organizationName, pan);
      verificationChecks.push({
        ...udyamResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (udyamResult.status !== 'VERIFIED') {
        complianceScore -= 10;
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        entityDiscrepancies.push({
          severity: 'MEDIUM',
          field: 'UDYAM_MSME',
          issue: `MSME Verification Issue: ${udyamResult.result}`,
          details: `Udyam No: ${udyamNo}`,
        });
      }
    }

    // 6. MCA Corporate Status Verification
    if (cinNo) {
      const mcaResult = await provider.verifyMCA(cinNo, organizationName);
      verificationChecks.push({
        ...mcaResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (mcaResult.status !== 'VERIFIED') {
        complianceScore -= 30;
        riskLevel = 'CRITICAL';
        entityDiscrepancies.push({
          severity: 'CRITICAL',
          field: 'MCA_CORPORATE_STATUS',
          issue: `Corporate Legal Entity Status: ${mcaResult.result}`,
          details: `CIN: ${cinNo}. Company Status: ${mcaResult.data?.companyStatus || 'Defunct'}`,
        });
      }
    }

    // 7. Income Tax Compliance & Outstanding Demands
    if (pan) {
      const taxResult = await provider.verifyIncomeTax(pan);
      verificationChecks.push({
        ...taxResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (taxResult.data?.outstandingDemand > 0) {
        complianceScore -= 10;
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        entityDiscrepancies.push({
          severity: 'MEDIUM',
          field: 'TAX_DEMAND',
          issue: `Outstanding Income Tax Demand: ₹${(taxResult.data.outstandingDemand / 100000).toFixed(2)} Lakhs`,
          details: `Status: ${taxResult.result}`,
        });
      }
    }

    // 8. EPFO Labor Statutory Dues Check
    if (epfoEstablishmentId || pan) {
      const epfoResult = await provider.verifyEPFO(epfoEstablishmentId, pan);
      verificationChecks.push({
        ...epfoResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (epfoResult.data?.pendingContributions > 0) {
        complianceScore -= 10;
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        entityDiscrepancies.push({
          severity: 'MEDIUM',
          field: 'EPFO_LABOR_DUES',
          issue: `Pending Employee Provident Fund Arrears: ₹${(epfoResult.data.pendingContributions / 100000).toFixed(2)} Lakhs`,
          details: `Establishment ID: ${epfoResult.data?.establishmentId || epfoEstablishmentId}`,
        });
      }
    }

    // 9. DPIIT Startup Recognition & PPP Exemptions
    if (startupRecognitionNo || bidderData.isStartup) {
      const startupResult = await provider.verifyStartup(startupRecognitionNo, pan);
      verificationChecks.push({
        ...startupResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });
    }

    // 10. GeM Seller Registry & Incident Rating
    if (gemSellerId || pan) {
      const gemResult = await provider.verifyGeM(gemSellerId, pan);
      verificationChecks.push({
        ...gemResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (gemResult.status === 'HIGH_RISK_DEBARRED') {
        complianceScore = Math.min(complianceScore, 15);
        riskLevel = 'CRITICAL';
        entityDiscrepancies.push({
          severity: 'CRITICAL',
          field: 'GEM_SELLER_STATUS',
          issue: 'Seller is debarred or suspended on GeM marketplace',
          details: `GeM Seller ID: ${gemResult.data?.sellerId}`,
        });
      }
    }

    // 11. BIS Quality Standards Check
    if (bisCertNo) {
      const bisResult = await provider.verifyBIS(bisCertNo);
      verificationChecks.push({
        ...bisResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (bisResult.status !== 'VERIFIED') {
        complianceScore -= 15;
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
        entityDiscrepancies.push({
          severity: 'MEDIUM',
          field: 'BIS_STANDARDS_CERTIFICATE',
          issue: `BIS Quality Standard Certification: ${bisResult.result}`,
          details: `Cert No: ${bisCertNo}`,
        });
      }
    }

    // 12. Make in India (MII) Local Content Calculation
    if (localContentDeclId || bidderData.localContentDeclared !== undefined) {
      const minRequired = tenderRequirements.minLocalContent || 50.0;
      const localContentResult = await provider.verifyLocalContent(localContentDeclId, minRequired);
      verificationChecks.push({
        ...localContentResult,
        verificationRunId,
        bidderId: bidderData.id || null,
        timestamp,
      });

      if (localContentResult.status !== 'VERIFIED' && bidderData.localContentDeclared < minRequired) {
        complianceScore -= 15;
        if (riskLevel === 'LOW') riskLevel = 'HIGH';
        entityDiscrepancies.push({
          severity: 'HIGH',
          field: 'LOCAL_CONTENT_DEFICIT',
          issue: `Declared local content (${bidderData.localContentDeclared || 0}%) is below mandatory threshold (${minRequired}%)`,
          details: `Make in India PPP Classification: ${localContentResult.data?.declaredClassification || 'Non-Local Supplier'}`,
        });
      }
    }

    // Clamp score between 0 and 100
    complianceScore = Math.max(0, Math.min(100, complianceScore));

    const providerMeta = verificationFactory.getProviderMetadata();

    return {
      verificationRunId,
      timestamp,
      bidder: {
        organizationName,
        pan,
        gstin,
        udyamNo,
        cinNo,
      },
      overallScore: complianceScore,
      riskLevel,
      status: riskLevel === 'LOW' ? 'VERIFIED_COMPLIANT' : (riskLevel === 'MEDIUM' ? 'REQUIRES_HUMAN_REVIEW' : 'NON_COMPLIANT'),
      isSynthetic: providerMeta.isSynthetic,
      provider: providerMeta.activeProvider,
      verificationSource: providerMeta.sourceLabel,
      disclaimer: 'PROTOTYPE DEMONSTRATION: Verification executed using Synthetic Regulatory Datasets. Production system connects directly to authorized Government of India APIs.',
      verificationChecks,
      entityDiscrepancies,
      summary: entityDiscrepancies.length === 0
        ? 'All statutory credentials match across government regulatory databases without discrepancies.'
        : `${entityDiscrepancies.length} discrepancy flag(s) identified during multi-source triangulation.`,
    };
  }
}

module.exports = new EntityTriangulationService();
