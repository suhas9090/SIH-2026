/**
 * AI Service Client
 * 
 * Centralises all calls to the FastAPI AI service (localhost:8000).
 * Replaces the scattered axios.post(AI_SERVICE_URL, ...) calls
 * in tenders.js and bidders.js.
 * 
 * Error handling: if the AI service is unavailable, the compliance
 * pipeline continues with the rule engine only (graceful degradation).
 * The LLM is an enhancement, not a dependency for core compliance.
 */

const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS = 120_000; // 2 minutes — OCR + LLM can take time

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Trigger async document processing.
 * The AI service will call back PATCH /api/documents/:id/status
 * at each processing stage.
 */
const processDocument = async ({
  documentId,
  bidderId = null,
  tenderId = null,
  filePath = null,
  documentType = 'OTHER',
  orgName = '',
}) => {
  try {
    const response = await client.post('/process-document', {
      documentId,
      bidderId,
      tenderId,
      filePath,
      documentType,
      orgName,
    });
    return response.data;
  } catch (err) {
    console.error(`[AI Client] processDocument failed: ${err.message}`);
    throw err;
  }
};

/**
 * Extract structured requirements from tender document text.
 * Gemini parses the tender language and returns structured JSON.
 * The backend then saves these as Requirement records.
 */
const extractRequirements = async ({ documentId, tenderId, text, context = '' }) => {
  try {
    const response = await client.post('/extract-requirements', {
      documentId,
      tenderId,
      text,
      context,
    });
    return response.data;
  } catch (err) {
    console.error(`[AI Client] extractRequirements failed: ${err.message}`);
    // Return empty — rule engine works without AI requirements extraction
    return { requirements: [], totalFound: 0, error: err.message };
  }
};

/**
 * Run AI analysis for a bidder.
 * - Semantic evidence matching per requirement
 * - RAG knowledge retrieval
 * - Gemini explanation generation
 * 
 * Returns AI-assisted analysis. The compliance engine makes final decisions.
 */
const analyzeBidder = async ({ bidderId, tenderId, requirements, documents, verifications }) => {
  try {
    const response = await client.post('/analyze-bidder', {
      bidderId,
      tenderId,
      requirements,
      documents,
      verifications,
    });
    return response.data;
  } catch (err) {
    console.error(`[AI Client] analyzeBidder failed: ${err.message}`);
    // Graceful degradation: return null so rule engine continues without AI
    return null;
  }
};

/**
 * Search the RAG knowledge base for relevant procurement guidelines.
 */
const ragSearch = async (query, topK = 5) => {
  try {
    const response = await client.post('/rag/search', { query, topK });
    return response.data?.results || [];
  } catch (err) {
    console.error(`[AI Client] ragSearch failed: ${err.message}`);
    return [];
  }
};

/**
 * Check AI service health.
 */
const healthCheck = async () => {
  try {
    const response = await client.get('/health', { timeout: 5000 });
    return response.data;
  } catch (err) {
    return { status: 'unavailable', error: err.message };
  }
};

module.exports = {
  processDocument,
  extractRequirements,
  analyzeBidder,
  ragSearch,
  healthCheck,
};
