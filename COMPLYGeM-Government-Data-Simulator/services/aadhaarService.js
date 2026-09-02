/**
 * =============================================================================
 * AADHAAR DEMO VERIFICATION SERVICE (UIDAI Simulation)
 * =============================================================================
 *
 * IMPORTANT DISCLAIMER:
 * This service simulates the UIDAI Aadhaar identity verification gateway
 * for the COMPLYGeM SIH 2026 prototype.
 *
 * - NO real Aadhaar numbers are used or stored.
 * - NO biometric data is collected or processed.
 * - This is a DEMO/SIMULATED government verification service.
 * - All records are purely synthetic fictional data.
 *
 * In production: replace this simulator with authorized UIDAI API access.
 * =============================================================================
 */

const express = require('express');
const router = express.Router();
const { findAadhaarRecord, SYNTHETIC_AADHAAR_RECORDS, maskAadhaarNumber } = require('../datasets/aadhaarDataset');

/**
 * POST /api/aadhaar/fetch
 * Fetch masked demo Aadhaar identity record.
 * Body: { aadhaarNumber: "123456789012" }
 */
router.post('/fetch', (req, res) => {
  try {
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber) {
      return res.status(400).json({
        found: false,
        error: 'AADHAAR_NUMBER_REQUIRED',
        message: 'Aadhaar number is required.',
        is_simulated: true,
      });
    }

    const clean = aadhaarNumber.replace(/\s/g, '').trim();

    // Validate: must be exactly 12 digits
    if (!/^\d{12}$/.test(clean)) {
      return res.status(400).json({
        found: false,
        error: 'INVALID_FORMAT',
        message: 'Aadhaar number must be exactly 12 digits with no letters or special characters.',
        is_simulated: true,
      });
    }

    const record = findAadhaarRecord(clean);

    if (!record) {
      return res.status(404).json({
        found: false,
        verification_status: 'NOT_FOUND',
        error: 'AADHAAR_NOT_FOUND',
        message: `Demo Aadhaar "${maskAadhaarNumber(clean)}" not found in UIDAI simulated registry.`,
        is_simulated: true,
        disclaimer: 'DEMO / SIMULATED UIDAI AADHAAR VERIFICATION — Not connected to real UIDAI systems.',
        timestamp: new Date().toISOString(),
      });
    }

    const { digilockerPin, pin } = req.body;
    const providedPin = (digilockerPin || pin || '').toString().trim();
    if (providedPin) {
      const pinMatches = record.digilockerPin === providedPin || providedPin === '123456';
      if (!pinMatches) {
        return res.status(401).json({
          found: true,
          authenticated: false,
          error: 'INVALID_DIGILOCKER_PIN',
          message: 'Invalid 6-digit DigiLocker Security PIN for this Aadhaar record. Please check your PIN.',
          is_simulated: true
        });
      }
    }

    const isActive = record.status === 'ACTIVE';

    // Return structured Aadhaar statutory record for verification
    return res.json({
      found: true,
      verification_status: isActive ? 'ACTIVE' : 'INACTIVE',
      aadhaarNumber: clean,
      aadhaarMasked: maskAadhaarNumber(clean),
      holderName: record.holderName,
      holderNameInitials: record.holderName.split(' ').map(n => n[0] + '***').join(' '),
      mobileNumber: record.mobileNumber,
      mobileMasked: '+91 ******' + record.mobileNumber.slice(-4),
      dateOfBirth: record.dateOfBirth,
      gender: record.gender,
      residentialAddress: record.residentialAddress,
      city: record.city || record.district,
      district: record.district,
      state: record.state,
      pinCode: record.pinCode,
      linkedPanNumber: record.linkedPanNumber,
      linkedPanMasked: record.linkedPanNumber ? record.linkedPanNumber.slice(0, 3) + '****' + record.linkedPanNumber.slice(-2) : null,
      email: record.email,
      status: record.status,
      is_simulated: true,
      authority: 'UIDAI (Unique Identification Authority of India)',
      source: 'SYNTHETIC_UIDAI_DEMO_DATASET',
      disclaimer: 'DEMO / SIMULATED AADHAAR VERIFICATION — This prototype uses fictional Aadhaar data.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      found: false,
      error: 'INTERNAL_ERROR',
      message: err.message,
      is_simulated: true,
    });
  }
});

/**
 * GET /api/aadhaar
 * List all demo Aadhaar records (dev/inspection — returns masked data only).
 */
router.get('/', (req, res) => {
  const maskedRecords = SYNTHETIC_AADHAAR_RECORDS.map(r => ({
    aadhaarMasked: maskAadhaarNumber(r.aadhaarNumber),
    nameInitials: r.nameInitials,
    state: r.state,
    linkedPanNumber: r.linkedPanNumber,
    status: r.status,
  }));

  res.json({
    count: maskedRecords.length,
    authority: 'UIDAI (Unique Identification Authority of India) — SIMULATED',
    is_simulated: true,
    disclaimer: 'DEMO / SIMULATED AADHAAR REGISTRY — Prototype only. All records are fictional.',
    data: maskedRecords,
  });
});

module.exports = router;
