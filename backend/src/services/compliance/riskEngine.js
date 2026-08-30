/**
 * Risk Assessment Engine
 * 
 * Calculates overall compliance score and risk level
 * based on compliance item results.
 */

const calculateScore = (complianceItems) => {
  if (!complianceItems.length) {
    return {
      overallScore: 0,
      riskLevel: 'HIGH',
      compliantCount: 0,
      nonCompliantCount: 0,
      missingCount: 0,
      inconsistentCount: 0,
      pendingCount: 0,
      reviewCount: 0,
      summary: 'No compliance items evaluated.',
      recommendations: 'Upload bidder documents and run verification.'
    };
  }

  const counts = {
    compliantCount: 0,
    nonCompliantCount: 0,
    missingCount: 0,
    inconsistentCount: 0,
    pendingCount: 0,
    reviewCount: 0
  };

  let mandatoryFailed = 0;
  let mandatoryTotal = 0;
  let weightedScore = 0;
  let totalWeight = 0;

  complianceItems.forEach(item => {
    const isMandatory = item.requirement?.mandatory !== false;
    const weight = isMandatory ? 2 : 1;
    totalWeight += weight;

    switch (item.status) {
      case 'COMPLIANT':
        counts.compliantCount++;
        weightedScore += weight * 100;
        break;
      case 'NON_COMPLIANT':
        counts.nonCompliantCount++;
        if (isMandatory) mandatoryFailed++;
        if (isMandatory) mandatoryTotal++;
        break;
      case 'MISSING':
        counts.missingCount++;
        weightedScore += weight * 0;
        if (isMandatory) mandatoryFailed++;
        if (isMandatory) mandatoryTotal++;
        break;
      case 'INCONSISTENT':
        counts.inconsistentCount++;
        weightedScore += weight * 25;
        break;
      case 'PENDING_VERIFICATION':
        counts.pendingCount++;
        weightedScore += weight * 50;
        break;
      case 'REQUIRES_HUMAN_REVIEW':
        counts.reviewCount++;
        weightedScore += weight * 60;
        break;
    }
  });

  const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  // Determine risk level
  let riskLevel;
  if (mandatoryFailed > 0 || overallScore < 30) {
    riskLevel = 'CRITICAL';
  } else if (counts.nonCompliantCount > 0 || overallScore < 55) {
    riskLevel = 'HIGH';
  } else if (counts.missingCount > 0 || counts.inconsistentCount > 0 || overallScore < 75) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  const summary = generateSummary(overallScore, riskLevel, counts, mandatoryFailed);
  const recommendations = generateRecommendations(counts, riskLevel);

  return { overallScore, riskLevel, summary, recommendations, ...counts };
};

const generateSummary = (score, riskLevel, counts, mandatoryFailed) => {
  const parts = [];
  if (score >= 80) parts.push('Bidder shows strong overall compliance.');
  else if (score >= 60) parts.push('Bidder shows moderate compliance with notable gaps.');
  else if (score >= 40) parts.push('Bidder shows significant compliance gaps.');
  else parts.push('Bidder has critical compliance failures requiring immediate attention.');

  if (mandatoryFailed > 0) parts.push(`${mandatoryFailed} mandatory requirement(s) failed or missing.`);
  if (counts.inconsistentCount > 0) parts.push(`${counts.inconsistentCount} inconsistency(ies) detected between documents.`);
  if (counts.reviewCount > 0) parts.push(`${counts.reviewCount} item(s) require human review.`);

  return parts.join(' ');
};

const generateRecommendations = (counts, riskLevel) => {
  const recs = [];
  if (counts.missingCount > 0) recs.push('Request missing documents from the bidder.');
  if (counts.nonCompliantCount > 0) recs.push('Review non-compliant requirements with the bidder.');
  if (counts.inconsistentCount > 0) recs.push('Investigate document inconsistencies before proceeding.');
  if (counts.reviewCount > 0) recs.push('Complete human review of flagged items.');
  if (riskLevel === 'CRITICAL') recs.push('Escalate to senior procurement officer due to critical risk.');

  return recs.length > 0 ? recs.join(' ') : 'No immediate action required. Proceed with standard review.';
};

module.exports = { calculateScore };
