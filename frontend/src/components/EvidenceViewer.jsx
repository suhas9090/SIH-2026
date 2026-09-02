import React from 'react';

const STATUS_COLORS = {
  COMPLIANT:            { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
  NON_COMPLIANT:        { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  MISSING:              { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
  MISSING_EVIDENCE:     { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' },
  INCONSISTENT:         { bg: '#faf5ff', border: '#e9d5ff', text: '#9333ea' },
  NEEDS_REVIEW:         { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
  UNVERIFIED:           { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
  PENDING_VERIFICATION: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
  REQUIRES_HUMAN_REVIEW:{ bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
};

/**
 * EvidenceViewer — Slide-over drawer showing full evidence for a compliance item.
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
            <div style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.1rem' }}>
              Evidence Review
            </div>
            <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 2, fontWeight: 600 }}>
              {item.requirement?.title || 'Compliance Item'}
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Status badge */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                    valueStyle={{ color: item.similarityScore >= 0.85 ? '#059669' : item.similarityScore >= 0.6 ? '#d97706' : '#dc2626' }}
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
                    background: isMock ? '#fffbeb' : '#ecfdf5',
                    color: isMock ? '#d97706' : '#059669',
                    border: `1px solid ${isMock ? '#fde68a' : '#a7f3d0'}`,
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
                  color: item.confidence >= 0.85 ? '#059669'
                    : item.confidence >= 0.6 ? '#d97706' : '#dc2626',
                }}
              />
            )}
          </Section>

          {/* Section 5: Human Review History */}
          <Section title="👤 Human Reviewer Decision">
            {item.reviews && item.reviews.length > 0 ? (
              <div>
                {item.reviews.map((rev) => (
                  <div key={rev.id} style={styles.reviewItem}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}>
                      <span style={{
                        ...styles.reviewAction,
                        color: rev.action === 'APPROVED' ? '#059669'
                          : rev.action === 'REJECTED' ? '#dc2626' : '#d97706',
                      }}>
                        {rev.action}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                        {new Date(rev.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {rev.remarks && (
                      <div style={styles.reviewRemarks}>{rev.remarks}</div>
                    )}
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Reviewed by: {rev.reviewer?.name || rev.reviewer?.email || 'Officer'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Not yet reviewed by a human officer." />
            )}
          </Section>
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
      <span style={{
        ...sStyles.rowValue,
        fontWeight: highlight ? 700 : 500,
        color: highlight ? '#0f172a' : '#334155',
        ...valueStyle,
      }}>
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
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  panel: {
    width: 480,
    maxWidth: '95vw',
    height: '100vh',
    background: '#ffffff',
    borderLeft: '1px solid #e2e8f0',
    boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.1)',
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
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    background: '#ffffff',
    zIndex: 10,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: 4,
  },
  scrollArea: {
    padding: '16px 20px',
    flex: 1,
  },
  statusBadge: {
    display: 'inline-block',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
    marginRight: 6,
  },
  categoryTag: {
    display: 'inline-block',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1d4ed8',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    marginRight: 6,
  },
  mandatoryTag: {
    display: 'inline-block',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: '0.72rem',
    fontWeight: 800,
  },
  aiDisclaimer: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#b45309',
    fontSize: '0.78rem',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  aiText: {
    color: '#334155',
    fontSize: '0.85rem',
    lineHeight: 1.6,
  },
  sourceTag: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1d4ed8',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  mockBadge: {
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 800,
  },
  mockWarning: {
    color: '#b45309',
    fontSize: '0.78rem',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 8,
    padding: '8px 10px',
    marginBottom: 10,
    marginTop: 4,
  },
  ruleText: {
    color: '#334155',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 12px',
  },
  reviewItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 8,
  },
  reviewAction: {
    fontWeight: 800,
    fontSize: '0.82rem',
  },
  reviewRemarks: {
    color: '#334155',
    fontSize: '0.82rem',
    marginTop: 4,
    marginBottom: 4,
  },
};

const sStyles = {
  sectionTitle: {
    color: '#0f172a',
    fontSize: '0.82rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #f1f5f9',
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
    color: '#64748b',
    fontSize: '0.8rem',
    fontWeight: 700,
    flexShrink: 0,
    minWidth: 120,
  },
  rowValue: {
    color: '#0f172a',
    fontSize: '0.82rem',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  emptyState: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontStyle: 'italic',
    margin: 0,
  },
};
