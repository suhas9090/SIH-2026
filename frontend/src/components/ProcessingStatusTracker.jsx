import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

// Processing stages in order (Spec §26, §27)
const STAGES = [
  { key: 'UPLOADED',                label: 'Document Uploaded',                icon: '📁' },
  { key: 'PROCESSING',              label: 'Initialising Processing',           icon: '⚙️' },
  { key: 'OCR_COMPLETED',           label: 'Extracting Text (OCR)',             icon: '🔍' },
  { key: 'PARSING',                 label: 'Parsing Document Structure',        icon: '📄' },
  { key: 'EXTRACTION_COMPLETED',    label: 'Extracting Entities & Evidence',    icon: '🧩' },
  { key: 'EMBEDDING',               label: 'Generating Embeddings',             icon: '🧠' },
  { key: 'ANALYZING',               label: 'AI Analysis (Gemini)',              icon: '✨' },
  { key: 'READY_FOR_REVIEW',        label: 'Ready for Review',                  icon: '✅' },
  { key: 'DEMO_COMPLETE',           label: 'Ready for Review (Demo)',           icon: '✅' },
];

const FAILED_KEY = 'FAILED';

const stageIndex = (key) => STAGES.findIndex((s) => s.key === key);

export default function ProcessingStatusTracker({ documentId, onComplete }) {
  const [status, setStatus] = useState('UPLOADED');
  const [ocrUsed, setOcrUsed] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!documentId || done) return;

    const poll = async () => {
      try {
        const res = await api.get(`/documents/${documentId}/status`);
        const { processingStatus, ocrUsed: ocr, confidence: conf } = res.data;

        setStatus(processingStatus);
        if (ocr !== undefined) setOcrUsed(ocr);
        if (conf !== undefined) setConfidence(conf);

        if (processingStatus === 'READY_FOR_REVIEW' || processingStatus === 'DEMO_COMPLETE') {
          setDone(true);
          clearInterval(intervalRef.current);
          onComplete?.();
        }

        if (processingStatus === FAILED_KEY) {
          setError('Document processing failed. Please re-upload or contact support.');
          setDone(true);
          clearInterval(intervalRef.current);
        }
      } catch (err) {
        // Don't surface network blips as errors unless they persist
        console.warn('Status poll error:', err.message);
      }
    };

    poll(); // immediate first check
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [documentId, done, onComplete]);

  const currentIdx = stageIndex(status);
  const isFailed = status === FAILED_KEY;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>⚙ AI Processing Pipeline</span>
        {ocrUsed && (
          <span style={styles.badge}>OCR Active</span>
        )}
        {confidence !== null && (
          <span style={styles.confidenceBadge}>
            Confidence: {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      {/* AI label — spec §29 */}
      <p style={styles.aiLabel}>
        ⚠ AI-assisted processing — not authoritative government verification
      </p>

      <div style={styles.stageList}>
        {STAGES.filter(s => s.key !== 'DEMO_COMPLETE').map((stage, idx) => {
          const isComplete = currentIdx > idx && !isFailed;
          const isActive   = currentIdx === idx && !isFailed && !done;
          const isCurrent  = currentIdx >= idx;

          return (
            <div key={stage.key} style={styles.stageRow}>
              {/* Connector line */}
              {idx > 0 && (
                <div style={{
                  ...styles.connector,
                  background: isComplete ? '#10b981' : '#1e2d4a',
                }} />
              )}
              <div style={{
                ...styles.stageIcon,
                background: isComplete ? '#10b981' : isActive ? '#3b82f6' : '#0d1b2e',
                border: `2px solid ${isComplete ? '#10b981' : isActive ? '#3b82f6' : '#1e2d4a'}`,
                animation: isActive ? 'pulse 1.5s infinite' : 'none',
              }}>
                {isComplete ? '✓' : isActive ? '…' : stage.icon}
              </div>
              <div style={styles.stageText}>
                <span style={{
                  ...styles.stageLabel,
                  color: isComplete ? '#10b981' : isActive ? '#60a5fa' : isCurrent ? '#f0f4ff' : '#4b6278',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {stage.label}
                </span>
                {isActive && (
                  <span style={styles.processingDots}>processing...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && (
        <div style={styles.errorBox}>
          <span style={{ marginRight: 8 }}>⚠</span>
          {error || 'Processing failed. Please check the document and retry.'}
        </div>
      )}

      {done && !isFailed && (
        <div style={styles.successBox}>
          ✅ Processing complete — document ready for compliance analysis
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    background: '#0a1628',
    border: '1px solid #1e2d4a',
    borderRadius: 12,
    padding: '16px 20px',
    fontFamily: "'Inter', sans-serif",
    minWidth: 300,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    color: '#f0f4ff',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  badge: {
    background: '#1e3a5f',
    color: '#60a5fa',
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  confidenceBadge: {
    background: '#1a2f1a',
    color: '#4ade80',
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  aiLabel: {
    color: '#f59e0b',
    fontSize: '0.72rem',
    marginBottom: 16,
    marginTop: 0,
    opacity: 0.85,
  },
  stageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  stageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    minHeight: 36,
  },
  connector: {
    position: 'absolute',
    left: 13,
    top: -18,
    width: 2,
    height: 18,
    transition: 'background 0.4s',
  },
  stageIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    flexShrink: 0,
    transition: 'all 0.3s',
    color: '#fff',
    fontWeight: 700,
  },
  stageText: {
    display: 'flex',
    flexDirection: 'column',
  },
  stageLabel: {
    fontSize: '0.82rem',
    transition: 'color 0.3s',
  },
  processingDots: {
    fontSize: '0.72rem',
    color: '#60a5fa',
    opacity: 0.8,
  },
  errorBox: {
    background: '#2d0e0e',
    border: '1px solid #7f1d1d',
    color: '#fca5a5',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.82rem',
    marginTop: 12,
  },
  successBox: {
    background: '#0a2e1a',
    border: '1px solid #166534',
    color: '#4ade80',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.82rem',
    marginTop: 12,
  },
};
