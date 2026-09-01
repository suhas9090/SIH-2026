import React from 'react';

const STATUS_COLORS = {
  COMPLIANT:            { bg: '#0a2e1a', border: '#166534', text: '#4ade80' },
  NON_COMPLIANT:        { bg: '#2d0e0e', border: '#7f1d1d', text: '#fca5a5' },
  MISSING:              { bg: '#1a1a0d', border: '#713f12', text: '#fbbf24' },
  MISSING_EVIDENCE:     { bg: '#1f1207', border: '#9a3412', text: '#fb923c' },
  INCONSISTENT:         { bg: '#1a0d1f', border: '#6b21a8', text: '#c084fc' },
  NEEDS_REVIEW:         { bg: '#1c1400', border: '#92400e', text: '#fcd34d' },
  UNVERIFIED:           { bg: '#111827', border: '#374151', text: '#9ca3af' },
  PENDING_VERIFICATION: { bg: '#0d1b2e', border: '#1e3a5f', text: '#60a5fa' },
  REQUIRES_HUMAN_REVIEW:{ bg: '#1c1400', border: '#92400e', text: '#fcd34d' },
};

/**
 * EvidenceViewer — Side panel / modal showing full evidence for a compliance item.
 * 
 * Displays:
 *  - Extracted document evidence (source, page, text excerpt)
 *  - Government verification result (with MOCK/LIVE badge)
 *  - AI assessment with mandatory disclaimer label
 *  - Reviewer decision (if reviewed)
 */
export default function EvidenceViewer({ item, onClose }) {
  if (!item) return null;

  const colors = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING_VERIFICATION;
  const isMock = item.verificationSource?.isMockData !== false;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.panelHeader}>
          <div>
            <div style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '1rem' }}>
              Evidence Review
            </div>
            <div style={{ color: '#4b6278', fontSize: '0.8rem', marginTop: 2 }}>
              {item.requirement?.title || 'Compliance Item'}
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Status badge */}
        <div style={{ padding: '0 20px 16px' }}>
          <span style={{
            ...styles.statusBadge,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}>
            {item.status?.replace(/_/g, ' ')}
          </span>
          <span style={styles.categoryTag}>
            {item.requirement?.category || 'OTHER'}
          </span>
          {item.requirement?.mandatory && (
            <span style={styles.mandatoryTag}>MANDATORY</span>
          )}
        </div>

        <div style={styles.scrollArea}>
          {/* Section 1: Document Evidence */}
          <Section title="📄 Document Evidence">
            {item.evidenceSummary ? (
              <div>
                <Row label="Evidence" value={item.evidenceSummary} highlight />
                {item.evidenceDocId && (
                  <Row label="Source Document" value={`Document ID: ${item.evidenceDocId}`} />
                )}
                {item.evidencePage && (
                  <Row label="Page" value={`Page ${item.evidencePage}`} />
                )}
                {item.similarityScore != null && (
                  <Row
                    label="Semantic Match"
                    value={`${Math.round(item.similarityScore * 100)}% confidence`}
                    valueStyle={{ color: item.similarityScore >= 0.85 ? '#4ade80' : item.similarityScore >= 0.6 ? '#fbbf24' : '#fca5a5' }}
                  />
                )}
              </div>
            ) : (
              <EmptyState message="No document evidence found for this requirement." />
            )}
          </Section>

          {/* Section 2: AI Assessment — always labelled */}
          <Section title="✨ AI Assessment">
            <div style={styles.aiDisclaimer}>
              ⚠ <strong>[AI Assessment]</strong> — This is AI-derived analysis from
              the Gemini language model. It is not authoritative government verification.
              Human review is required before making any procurement decision.
            </div>
            {item.aiExplanation ? (
              <div>
                <div style={styles.aiText}>{item.aiExplanation}</div>
                {item.ragReference && (
                  <Row label="RAG Reference" value={item.ragReference} />
                )}
              </div>
            ) : (
              <EmptyState message="No AI explanation available." />
            )}
          </Section>

          {/* Section 3: Government Verification */}
          <Section title="🏛 Government Verification">
            {item.verificationSource ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={styles.sourceTag}>{item.verificationSource.source}</span>
                  <span style={{
                    ...styles.mockBadge,
                    background: isMock ? '#1f2000' : '#0a2e1a',
                    color: isMock ? '#fbbf24' : '#4ade80',
                    border: `1px solid ${isMock ? '#713f12' : '#166534'}`,
                  }}>
                    {isMock ? '⚠ MOCK DATA' : '✅ LIVE DATA'}
                  </span>
                </div>
                {isMock && (
                  <p style={styles.mockWarning}>
                    This verification uses simulated mock data.
                    Results are for demonstration purposes only.
                    Not authoritative government data.
                  </p>
                )}
                <Row
                  label="Verification Status"
                  value={item.verificationSource.status}
                />
                {item.verificationSource.verifiedAt && (
                  <Row
                    label="Verified At"
                    value={new Date(item.verificationSource.verifiedAt).toLocaleString('en-IN')}
                  />
                )}
              </div>
            ) : (
              <EmptyState message="No government verification run for this item." />
            )}
          </Section>

          {/* Section 4: Applied Rule */}
          <Section title="⚖ Compliance Rule Applied">
            {item.ruleApplied ? (
              <div style={styles.ruleText}>{item.ruleApplied}</div>
            ) : (
              <EmptyState message="No rule applied." />
            )}
            {item.confidence != null && (
              <Row
                label="Rule Confidence"
                value={`${Math.round(item.confidence * 100)}%`}
                valueStyle={{
                  color: item.confidence >= 0.85 ? '#4ade80'
                    : item.confidence >= 0.6 ? '#fbbf24' : '#fca5a5',
                }}
              />
            )}
          </Section>

          {/* Section 5: Reviewer Decision */}
          {item.reviews?.length > 0 && (
            <Section title="👤 Reviewer Decisions">
              {item.reviews.map((review, i) => (
                <div key={i} style={styles.reviewItem}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      ...styles.reviewAction,
                      color: review.action === 'APPROVED' ? '#4ade80'
                        : review.action === 'REJECTED' ? '#fca5a5' : '#fbbf24',
                    }}>
                      [Human Decision] {review.action}
                    </span>
                    <span style={{ color: '#4b6278', fontSize: '0.75rem' }}>
                      by {review.reviewer?.name || 'Reviewer'}
                    </span>
                  </div>
                  {review.remarks && (
                    <div style={styles.reviewRemarks}>{review.remarks}</div>
                  )}
                  <div style={{ color: '#4b6278', fontSize: '0.72rem' }}>
                    {new Date(review.reviewedAt).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={sStyles.sectionTitle}>{title}</div>
      <div style={sStyles.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ label, value, highlight, valueStyle }) {
  return (
    <div style={sStyles.row}>
      <span style={sStyles.rowLabel}>{label}</span>
      <span style={{ ...sStyles.rowValue, ...(highlight && { color: '#f0f4ff' }), ...valueStyle }}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }) {
  return <p style={sStyles.emptyState}>{message}</p>;
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  panel: {
    width: 480,
    maxWidth: '95vw',
    height: '100vh',
    background: '#080f1e',
    borderLeft: '1px solid #1e2d4a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', sans-serif",
    overflowY: 'auto',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #1e2d4a',
    position: 'sticky',
    top: 0,
    background: '#080f1e',
    zIndex: 10,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#4b6278',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: 4,
  },
  scrollArea: {
    padding: '16px 20px',
    flex: 1,
  },
  statusBadge: {
    display: 'inline-block',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginRight: 6,
  },
  categoryTag: {
    display: 'inline-block',
    background: '#0d1b2e',
    border: '1px solid #1e3a5f',
    color: '#60a5fa',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: '0.72rem',
    marginRight: 6,
  },
  mandatoryTag: {
    display: 'inline-block',
    background: '#2d0e0e',
    border: '1px solid #7f1d1d',
    color: '#fca5a5',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: '0.72rem',
  },
  aiDisclaimer: {
    background: '#1c1400',
    border: '1px solid #92400e',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#fcd34d',
    fontSize: '0.78rem',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  aiText: {
    color: '#c0cfe0',
    fontSize: '0.85rem',
    lineHeight: 1.6,
  },
  sourceTag: {
    background: '#0d1b2e',
    border: '1px solid #1e3a5f',
    color: '#93c5fd',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  mockBadge: {
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  mockWarning: {
    color: '#fbbf24',
    fontSize: '0.78rem',
    background: '#1f1200',
    borderRadius: 6,
    padding: '8px 10px',
    marginBottom: 10,
    marginTop: 4,
  },
  ruleText: {
    color: '#c0cfe0',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    background: '#0d1b2e',
    borderRadius: 8,
    padding: '10px 12px',
  },
  reviewItem: {
    background: '#0d1b2e',
    border: '1px solid #1e2d4a',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
  },
  reviewAction: {
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  reviewRemarks: {
    color: '#c0cfe0',
    fontSize: '0.82rem',
    marginTop: 4,
    marginBottom: 4,
  },
};

const sStyles = {
  sectionTitle: {
    color: '#93c5fd',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #1e2d4a',
  },
  sectionBody: {
    paddingLeft: 4,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  rowLabel: {
    color: '#4b6278',
    fontSize: '0.8rem',
    flexShrink: 0,
    minWidth: 120,
  },
  rowValue: {
    color: '#8ba3bb',
    fontSize: '0.82rem',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  emptyState: {
    color: '#2e3f50',
    fontSize: '0.8rem',
    fontStyle: 'italic',
    margin: 0,
  },
};
