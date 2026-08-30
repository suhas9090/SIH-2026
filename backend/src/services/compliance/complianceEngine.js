/**
 * Deterministic Compliance Rule Engine
 * 
 * This engine applies explicit rules to evaluate each requirement.
 * It does NOT use LLM for compliance decisions.
 * LLM assists with extraction only; the final rule evaluation is deterministic.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const evaluate = async (bidder, verifications, aiResults) => {
  const requirements = bidder.tender?.requirements || [];
  const complianceItems = [];

  // Create a lookup map for verifications
  const verificationMap = {};
  verifications.forEach(v => { verificationMap[v.source] = v; });

  for (const req of requirements) {
    const item = await evaluateRequirement(req, bidder, verificationMap, aiResults);
    complianceItems.push(item);
  }

  return complianceItems;
};

const evaluateRequirement = async (requirement, bidder, verificationMap, aiResults) => {
  const baseItem = {
    requirementId: requirement.id,
    confidence: 0.9,
    ruleApplied: null,
    aiExplanation: null,
    evidenceSummary: null,
    similarityScore: null,
    status: 'PENDING_VERIFICATION'
  };

  // Check AI results for this requirement
  const aiItem = aiResults?.complianceItems?.find(i => i.requirementId === requirement.id);
  if (aiItem) {
    baseItem.aiExplanation = aiItem.explanation;
    baseItem.evidenceSummary = aiItem.evidence;
    baseItem.similarityScore = aiItem.similarityScore;
    baseItem.evidenceDocId = aiItem.documentId;
    baseItem.evidencePage = aiItem.page;
    baseItem.ragReference = aiItem.ragReference;
  }

  switch (requirement.category) {
    case 'TAX':
    case 'REGISTRATION':
      return evaluateRegistrationRequirement(requirement, bidder, verificationMap, baseItem);

    case 'FINANCIAL':
      return evaluateFinancialRequirement(requirement, bidder, aiItem, baseItem);

    case 'MSME_UDYAM':
      return evaluateMSMERequirement(requirement, bidder, verificationMap, baseItem);

    case 'BLACKLISTING':
      return evaluateBlacklistRequirement(requirement, verificationMap, baseItem);

    case 'OEM':
    case 'CERTIFICATION':
    case 'EXPERIENCE':
    case 'TECHNICAL':
      return evaluateDocumentRequirement(requirement, bidder, aiItem, baseItem);

    default:
      return evaluateDocumentRequirement(requirement, bidder, aiItem, baseItem);
  }
};

const evaluateRegistrationRequirement = (req, bidder, verificationMap, base) => {
  const title = req.title?.toLowerCase() || '';

  if (title.includes('gst')) {
    const gstVerification = verificationMap['GST_PORTAL'];
    if (!bidder.gstin) {
      return { ...base, status: 'MISSING', ruleApplied: 'GST number not provided by bidder.', confidence: 1.0 };
    }
    if (gstVerification?.status === 'MOCK_VERIFIED' || gstVerification?.status === 'VERIFIED') {
      const gstStatus = gstVerification.verifiedData?.status;
      if (gstStatus === 'ACTIVE') {
        return { ...base, status: 'COMPLIANT', ruleApplied: 'GST registration is Active.', evidenceSummary: `GSTIN: ${bidder.gstin}`, confidence: 1.0 };
      } else {
        return { ...base, status: 'NON_COMPLIANT', ruleApplied: `GST status is ${gstStatus}, not Active.`, confidence: 1.0 };
      }
    }
    return { ...base, status: 'PENDING_VERIFICATION', ruleApplied: 'GST verification pending.', confidence: 0.5 };
  }

  if (title.includes('pan')) {
    const panVerification = verificationMap['PAN_INCOME_TAX'];
    if (!bidder.pan) {
      return { ...base, status: 'MISSING', ruleApplied: 'PAN not provided.', confidence: 1.0 };
    }
    if (panVerification?.status === 'MOCK_VERIFIED' || panVerification?.status === 'VERIFIED') {
      return { ...base, status: 'COMPLIANT', ruleApplied: 'PAN verified and active.', evidenceSummary: `PAN: ${bidder.pan}`, confidence: 1.0 };
    }
    return { ...base, status: 'PENDING_VERIFICATION', ruleApplied: 'PAN verification pending.', confidence: 0.5 };
  }

  // Generic registration: check if document was submitted
  if (base.evidenceSummary) {
    return { ...base, status: 'COMPLIANT', ruleApplied: 'Registration document found in submission.', confidence: 0.85 };
  }
  return { ...base, status: 'MISSING', ruleApplied: 'Required registration document not found.', confidence: 0.9 };
};

const evaluateFinancialRequirement = (req, bidder, aiItem, base) => {
  if (!aiItem?.numericValue) {
    return { ...base, status: 'MISSING', ruleApplied: 'Financial information not found in submitted documents.', confidence: 0.85 };
  }

  const actualValue = parseFloat(aiItem.numericValue);
  const requiredMin = req.minValue;
  const requiredMax = req.maxValue;

  let ruleDesc = '';
  let compliant = true;

  if (requiredMin !== null && requiredMin !== undefined) {
    if (actualValue < requiredMin) {
      compliant = false;
      ruleDesc = `Actual: ₹${formatCrore(actualValue)} < Required: ₹${formatCrore(requiredMin)}`;
    } else {
      ruleDesc = `Actual: ₹${formatCrore(actualValue)} >= Required: ₹${formatCrore(requiredMin)}`;
    }
  }

  if (requiredMax !== null && requiredMax !== undefined && actualValue > requiredMax) {
    compliant = false;
    ruleDesc += ` Exceeds maximum: ₹${formatCrore(requiredMax)}`;
  }

  return {
    ...base,
    status: compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    ruleApplied: ruleDesc || 'Financial threshold rule applied.',
    evidenceSummary: `Found: ₹${formatCrore(actualValue)} ${req.currency || 'INR'} (${req.period || 'FY'})`,
    confidence: aiItem?.confidence || 0.85
  };
};

const evaluateMSMERequirement = (req, bidder, verificationMap, base) => {
  const udyamVerification = verificationMap['UDYAM_PORTAL'];
  if (!bidder.udyamNo) {
    if (req.mandatory) {
      return { ...base, status: 'MISSING', ruleApplied: 'Udyam/MSME registration number not provided.', confidence: 1.0 };
    }
    return { ...base, status: 'NON_COMPLIANT', ruleApplied: 'MSME registration required but not submitted.', confidence: 1.0 };
  }

  if (udyamVerification?.status === 'MOCK_VERIFIED' || udyamVerification?.status === 'VERIFIED') {
    const category = udyamVerification.verifiedData?.category;
    return {
      ...base, status: 'COMPLIANT',
      ruleApplied: `Udyam verified. Category: ${category}`,
      evidenceSummary: `Udyam No: ${bidder.udyamNo}, Category: ${category}`,
      confidence: 1.0
    };
  }
  return { ...base, status: 'PENDING_VERIFICATION', ruleApplied: 'Udyam verification pending.' };
};

const evaluateBlacklistRequirement = (req, verificationMap, base) => {
  const blacklistCheck = verificationMap['BLACKLIST_REGISTRY'];
  if (!blacklistCheck) {
    return { ...base, status: 'PENDING_VERIFICATION', ruleApplied: 'Blacklist check not yet performed.' };
  }

  const isBlacklisted = blacklistCheck.verifiedData?.isBlacklisted || blacklistCheck.verifiedData?.isDebarred;
  if (isBlacklisted) {
    return { ...base, status: 'NON_COMPLIANT', ruleApplied: 'Bidder is blacklisted or debarred.', confidence: 1.0 };
  }
  return {
    ...base, status: 'COMPLIANT',
    ruleApplied: 'No adverse record found in blacklist/debarment registries.',
    evidenceSummary: `Checked: ${blacklistCheck.verifiedData?.registries?.join(', ')}`,
    confidence: blacklistCheck.isMockData ? 0.7 : 1.0
  };
};

const evaluateDocumentRequirement = (req, bidder, aiItem, base) => {
  if (!aiItem || !aiItem.evidence) {
    // Check if relevant documents were uploaded
    const docs = bidder.documents || [];
    const hasRelevantDoc = docs.some(d => {
      const reqLower = req.title?.toLowerCase() || '';
      const docType = d.documentType?.toLowerCase() || '';
      return docType.includes('oem') && reqLower.includes('oem') ||
             docType.includes('experience') && reqLower.includes('experience') ||
             docType.includes('certification') && reqLower.includes('certif') ||
             docType.includes('startup') && reqLower.includes('startup');
    });

    if (hasRelevantDoc) {
      return { ...base, status: 'REQUIRES_HUMAN_REVIEW', ruleApplied: 'Document submitted but AI analysis pending. Human review required.', confidence: 0.5 };
    }
    return { ...base, status: 'MISSING', ruleApplied: 'Required document not found in submission.', confidence: 0.9 };
  }

  // AI found evidence — use similarity score to determine status
  if (aiItem.similarityScore >= 0.85) {
    return { ...base, status: 'COMPLIANT', ruleApplied: `Evidence found with high confidence (score: ${aiItem.similarityScore?.toFixed(2)}).`, confidence: aiItem.confidence || 0.85 };
  } else if (aiItem.similarityScore >= 0.6) {
    return { ...base, status: 'REQUIRES_HUMAN_REVIEW', ruleApplied: `Partial evidence found. Similarity score: ${aiItem.similarityScore?.toFixed(2)}. Human review recommended.`, confidence: aiItem.confidence || 0.65 };
  }
  return { ...base, status: 'INCONSISTENT', ruleApplied: `Low similarity evidence found. Score: ${aiItem.similarityScore?.toFixed(2)}. Possible mismatch.`, confidence: aiItem.confidence || 0.5 };
};

const formatCrore = (value) => {
  if (!value && value !== 0) return 'N/A';
  const crore = value / 10000000;
  return `${crore.toFixed(2)} Cr`;
};

module.exports = { evaluate };
