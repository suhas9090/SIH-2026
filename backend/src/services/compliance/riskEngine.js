/**
 * Risk Assessment Engine — v2 (Spec §14, §16)
 *
 * Produces:
 *  - overallScore      (0–100, weighted)
 *  - riskLevel         (LOW | MEDIUM | HIGH | CRITICAL)
 *  - formula           (transparent breakdown, no opaque AI number)
 *  - riskFlags         (generated from real compliance data)
 *
 * IMPORTANT: scores are computed from actual ComplianceItem data.
 * Never hard-code or randomise scores.
 */

// ---------------------------------------------------------------------------
// Factor weights (must sum to 1.0)
// ---------------------------------------------------------------------------
const FACTOR_WEIGHTS = {
  missingDocuments:     0.30,
  requirementMismatch:  0.40,
  verificationIssues:   0.30,
};

// Per-status score contribution (0–100 scale, higher = better)
const STATUS_SCORE = {
  COMPLIANT:             100,
  NON_COMPLIANT:           0,
  MISSING:                 0,
  MISSING_EVIDENCE:       15,
  INCONSISTENT:           20,
  NEEDS_REVIEW:           55,
  UNVERIFIED:             40,
  PENDING_VERIFICATION:   50,
  REQUIRES_HUMAN_REVIEW:  55,
};

// ---------------------------------------------------------------------------
// Main export: calculateScore
// ---------------------------------------------------------------------------
const calculateScore = (complianceItems, verifications = []) => {
  if (!complianceItems || !complianceItems.length) {
    return _emptyResult();
  }

  // ── 1. Count by status ──────────────────────────────────────────────────
  const counts = _countStatuses(complianceItems);

  // ── 2. Calculate factor scores ──────────────────────────────────────────
  const factors = _calculateFactors(complianceItems, verifications, counts);

  // ── 3. Weighted total ───────────────────────────────────────────────────
  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + f.contribution, 0)
  );

  // ── 4. Risk level ───────────────────────────────────────────────────────
  const hasMandatoryFailure = complianceItems.some(
    (item) =>
      item.requirement?.mandatory !== false &&
      ['NON_COMPLIANT', 'MISSING'].includes(item.status)
  );

  const riskLevel = _determineRiskLevel(overallScore, hasMandatoryFailure, counts);

  // ── 5. Risk flags ───────────────────────────────────────────────────────
  const riskFlags = _generateRiskFlags(complianceItems, verifications);

  // ── 6. Narrative summary ────────────────────────────────────────────────
  const summary = _generateSummary(overallScore, riskLevel, counts, hasMandatoryFailure);
  const recommendations = _generateRecommendations(counts, riskLevel);

  return {
    overallScore,
    riskLevel,
    formula: {
      description: 'Weighted compliance score across three risk factor categories',
      factors,
      total: overallScore,
      breakdown: counts,
    },
    riskFlags,
    summary,
    recommendations,
    ...counts,
  };
};

// ---------------------------------------------------------------------------
// Count status occurrences
// ---------------------------------------------------------------------------
const _countStatuses = (items) => {
  const counts = {
    compliantCount: 0,
    nonCompliantCount: 0,
    missingCount: 0,
    inconsistentCount: 0,
    pendingCount: 0,
    reviewCount: 0,
    missingEvidenceCount: 0,
    unverifiedCount: 0,
  };
  items.forEach((item) => {
    switch (item.status) {
      case 'COMPLIANT':              counts.compliantCount++;       break;
      case 'NON_COMPLIANT':          counts.nonCompliantCount++;    break;
      case 'MISSING':                counts.missingCount++;         break;
      case 'MISSING_EVIDENCE':       counts.missingEvidenceCount++; break;
      case 'INCONSISTENT':           counts.inconsistentCount++;    break;
      case 'NEEDS_REVIEW':
      case 'REQUIRES_HUMAN_REVIEW':  counts.reviewCount++;          break;
      case 'UNVERIFIED':             counts.unverifiedCount++;      break;
      default:                       counts.pendingCount++;         break;
    }
  });
  return counts;
};

// ---------------------------------------------------------------------------
// Calculate the three weighted factor scores
// ---------------------------------------------------------------------------
const _calculateFactors = (items, verifications, counts) => {
  const total = items.length || 1;

  // Factor 1: Missing Documents (MISSING + MISSING_EVIDENCE)
  const missingRatio = (counts.missingCount + counts.missingEvidenceCount) / total;
  const missingScore = Math.round((1 - missingRatio) * 100);

  // Factor 2: Requirement Mismatch (NON_COMPLIANT + INCONSISTENT)
  const mismatchRatio = (counts.nonCompliantCount + counts.inconsistentCount) / total;
  const mismatchScore = Math.round((1 - mismatchRatio) * 100);

  // Factor 3: Verification Issues (UNVERIFIED + items needing review weighted by severity)
  const verificationFailCount = verifications.filter(
    (v) => v.status === 'FAILED' || v.status === 'UNAVAILABLE'
  ).length;
  const verificationPenalty = Math.min(verificationFailCount * 10, 40);
  const reviewPenalty = Math.min(counts.reviewCount * 5, 30);
  const verificationScore = Math.max(0, 100 - verificationPenalty - reviewPenalty);

  return [
    {
      name: 'Missing Documents',
      weight: FACTOR_WEIGHTS.missingDocuments,
      score: missingScore,
      contribution: Math.round(missingScore * FACTOR_WEIGHTS.missingDocuments),
      detail: `${counts.missingCount} missing, ${counts.missingEvidenceCount} with insufficient evidence`,
    },
    {
      name: 'Requirement Mismatch',
      weight: FACTOR_WEIGHTS.requirementMismatch,
      score: mismatchScore,
      contribution: Math.round(mismatchScore * FACTOR_WEIGHTS.requirementMismatch),
      detail: `${counts.nonCompliantCount} non-compliant, ${counts.inconsistentCount} inconsistent`,
    },
    {
      name: 'Verification Issues',
      weight: FACTOR_WEIGHTS.verificationIssues,
      score: verificationScore,
      contribution: Math.round(verificationScore * FACTOR_WEIGHTS.verificationIssues),
      detail: `${verificationFailCount} failed verifications, ${counts.reviewCount} items need review`,
    },
  ];
};

// ---------------------------------------------------------------------------
// Risk level from score + mandatory failures
// ---------------------------------------------------------------------------
const _determineRiskLevel = (score, hasMandatoryFailure, counts) => {
  if (hasMandatoryFailure || score < 30) return 'CRITICAL';
  if (counts.nonCompliantCount > 0 || score < 55) return 'HIGH';
  if (counts.missingCount > 0 || counts.inconsistentCount > 0 || score < 75) return 'MEDIUM';
  return 'LOW';
};

// ---------------------------------------------------------------------------
// Risk flags generated from real compliance data
// ---------------------------------------------------------------------------
const _generateRiskFlags = (items, verifications) => {
  const flags = [];

  items.forEach((item) => {
    const req = item.requirement;
    const reqTitle = req?.title || 'Unknown requirement';
    const isMandatory = req?.mandatory !== false;

    // Mandatory document missing
    if (item.status === 'MISSING' && isMandatory) {
      flags.push({
        code: 'MISSING_DOCUMENT',
        severity: 'CRITICAL',
        title: 'Mandatory document missing',
        description: `Required document for "${reqTitle}" was not submitted.`,
        requirementId: req?.id,
        evidence: null,
      });
    }

    // Document submitted but evidence not found
    if (item.status === 'MISSING_EVIDENCE') {
      flags.push({
        code: 'INSUFFICIENT_EVIDENCE',
        severity: isMandatory ? 'HIGH' : 'MEDIUM',
        title: 'Insufficient evidence',
        description: `Document uploaded for "${reqTitle}" but required information was not found within it.`,
        requirementId: req?.id,
        evidence: item.evidenceSummary || null,
      });
    }

    // Non-compliant requirement
    if (item.status === 'NON_COMPLIANT') {
      const isFinancial = req?.category === 'FINANCIAL';
      flags.push({
        code: isFinancial ? 'TURNOVER_BELOW_THRESHOLD' : 'REQUIREMENT_MISMATCH',
        severity: isMandatory ? 'HIGH' : 'MEDIUM',
        title: isFinancial ? 'Turnover below required threshold' : 'Requirement not met',
        description: item.ruleApplied || `"${reqTitle}" requirement not satisfied.`,
        requirementId: req?.id,
        evidence: item.evidenceSummary || null,
      });
    }

    // Inconsistent evidence
    if (item.status === 'INCONSISTENT') {
      flags.push({
        code: 'INCONSISTENT_INFORMATION',
        severity: 'HIGH',
        title: 'Inconsistent bidder information',
        description: `Conflicting evidence found for "${reqTitle}". ${item.ruleApplied || ''}`,
        requirementId: req?.id,
        evidence: item.evidenceSummary || null,
      });
    }

    // Human review required
    if (item.status === 'REQUIRES_HUMAN_REVIEW' || item.status === 'NEEDS_REVIEW') {
      flags.push({
        code: 'MANUAL_VERIFICATION_REQUIRED',
        severity: 'MEDIUM',
        title: 'Manual verification required',
        description: `"${reqTitle}" could not be conclusively verified by the AI engine. Human review is required.`,
        requirementId: req?.id,
        evidence: item.evidenceSummary || null,
      });
    }

    // Unverified external source
    if (item.status === 'UNVERIFIED') {
      flags.push({
        code: 'VERIFICATION_UNAVAILABLE',
        severity: 'MEDIUM',
        title: 'Government verification unavailable',
        description: `External verification for "${reqTitle}" could not be completed. Source may be unavailable.`,
        requirementId: req?.id,
        evidence: null,
      });
    }
  });

  // Verification-level flags
  verifications.forEach((v) => {
    if (v.status === 'FAILED') {
      flags.push({
        code: 'REGISTRATION_MISMATCH',
        severity: 'HIGH',
        title: `${v.source.replace(/_/g, ' ')} verification failed`,
        description: `Government portal verification returned FAILED status for ${v.source}.`,
        requirementId: null,
        evidence: null,
      });
    }
    if (v.status === 'UNAVAILABLE') {
      flags.push({
        code: 'GST_VERIFICATION_UNAVAILABLE',
        severity: 'LOW',
        title: `${v.source.replace(/_/g, ' ')} portal unavailable`,
        description: `Could not connect to ${v.source} for real-time verification. Marked as UNAVAILABLE.`,
        requirementId: null,
        evidence: null,
      });
    }
  });

  // De-duplicate by code+requirementId
  const seen = new Set();
  return flags.filter((f) => {
    const key = `${f.code}:${f.requirementId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ---------------------------------------------------------------------------
// Narrative helpers
// ---------------------------------------------------------------------------
const _generateSummary = (score, riskLevel, counts, mandatoryFailed) => {
  const parts = [];
  if (score >= 80) parts.push('Bidder shows strong overall compliance.');
  else if (score >= 60) parts.push('Bidder shows moderate compliance with notable gaps.');
  else if (score >= 40) parts.push('Bidder shows significant compliance gaps requiring attention.');
  else parts.push('Bidder has critical compliance failures requiring immediate attention.');
  if (mandatoryFailed) parts.push(`${counts.nonCompliantCount + counts.missingCount} mandatory requirement(s) failed or missing.`);
  if (counts.inconsistentCount > 0) parts.push(`${counts.inconsistentCount} inconsistency(ies) detected between documents.`);
  if (counts.reviewCount > 0) parts.push(`${counts.reviewCount} item(s) require human review.`);
  if (counts.unverifiedCount > 0) parts.push(`${counts.unverifiedCount} item(s) could not be verified due to unavailable external sources.`);
  return parts.join(' ');
};

const _generateRecommendations = (counts, riskLevel) => {
  const recs = [];
  if (counts.missingCount > 0) recs.push('Request missing documents from the bidder.');
  if (counts.nonCompliantCount > 0) recs.push('Review non-compliant requirements with the bidder.');
  if (counts.inconsistentCount > 0) recs.push('Investigate document inconsistencies before proceeding.');
  if (counts.reviewCount > 0) recs.push('Complete human review of flagged items before finalising assessment.');
  if (counts.unverifiedCount > 0) recs.push('Retry government portal verifications when services become available.');
  if (riskLevel === 'CRITICAL') recs.push('Escalate to senior procurement officer immediately due to critical risk level.');
  return recs.length > 0 ? recs.join(' ') : 'No immediate action required. Proceed with standard review.';
};

const _emptyResult = () => ({
  overallScore: 0,
  riskLevel: 'HIGH',
  formula: {
    description: 'No compliance items evaluated',
    factors: [],
    total: 0,
    breakdown: {},
  },
  riskFlags: [],
  compliantCount: 0, nonCompliantCount: 0, missingCount: 0,
  inconsistentCount: 0, pendingCount: 0, reviewCount: 0,
  missingEvidenceCount: 0, unverifiedCount: 0,
  summary: 'No compliance items evaluated.',
  recommendations: 'Upload bidder documents and run verification.',
});

module.exports = { calculateScore };
