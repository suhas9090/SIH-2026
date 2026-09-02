/**
 * Synthetic Startup India / DPIIT Recognition Dataset
 * Synchronized with 20 master corporate identities.
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const { SYNTHETIC_PAN_RECORDS } = require('./panDataset');

const STARTUP_DATA_BY_PAN = {
  'SYNPA0001C': { regNo: 'DIPP-44912', sector: 'Industrial Safety & IoT Hardware', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2028', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
  'SYNPA0004C': { regNo: 'DIPP-55120', sector: 'Defence Tech & Tactical Gear', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2030', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
  'SYNPA0007L': { regNo: 'DIPP-66230', sector: 'Physical Security & Smart IoT', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2031', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
  'SYNPA0011C': { regNo: 'DIPP-77890', sector: 'Enterprise Software & Cloud Platforms', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2030', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
  'SYNPA0012C': { regNo: 'DIPP-88910', sector: 'AI Hardware & Cyber Defence', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2031', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD', 'TAX_EXEMPT_80_IAC'] },
  'SYNPA0014C': { regNo: 'DIPP-99210', sector: 'Cloud Infrastructure & High Performance Computing', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2032', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
  'SYNPA0017C': { regNo: 'DIPP-10452', sector: 'Aviation, Unmanned Aerial Vehicles & Defence Drones', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2031', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
  'SYNPA0020C': { regNo: 'DIPP-11920', sector: 'Military Cryptography & Critical Infrastructure Defence', status: 'RECOGNIZED_STARTUP', validity: 'VALID_TILL_2029', exempt: ['PRIOR_EXPERIENCE', 'TURNOVER', 'EMD'] },
};

const SYNTHETIC_STARTUP_RECORDS = SYNTHETIC_PAN_RECORDS.map((rec, i) => {
  const startup = STARTUP_DATA_BY_PAN[rec.panNumber];
  if (startup) {
    return {
      recognitionNumber: startup.regNo,
      startupName: rec.legalName,
      panNumber: rec.panNumber,
      incorporationDate: rec.dateOfIncorporation || '2020-01-01',
      recognitionDate: '2021-01-15',
      sector: startup.sector,
      startupStatus: startup.status,
      recognitionStatus: 'ACTIVE',
      validity: startup.validity,
      exemptionsEligible: startup.exempt,
      state: rec.jurisdiction ? rec.jurisdiction.split(',').pop().trim() : 'India',
      verificationSource: 'SYNTHETIC_DPIIT_STARTUP_INDIA',
      lastVerifiedAt: new Date().toISOString(),
    };
  }

  // Non-startup enterprise record
  return {
    recognitionNumber: `DPIIT-GEN-${String(i + 1).padStart(3, '0')}`,
    startupName: rec.legalName,
    panNumber: rec.panNumber,
    incorporationDate: rec.dateOfIncorporation || '2015-01-01',
    recognitionDate: null,
    sector: 'Established Commercial Entity',
    startupStatus: 'NON_STARTUP_ESTABLISHED_ENTERPRISE',
    recognitionStatus: 'NOT_APPLICABLE',
    validity: 'N/A',
    exemptionsEligible: [],
    state: rec.jurisdiction ? rec.jurisdiction.split(',').pop().trim() : 'India',
    verificationSource: 'SYNTHETIC_DPIIT_STARTUP_INDIA',
    lastVerifiedAt: new Date().toISOString(),
  };
});

module.exports = {
  SYNTHETIC_STARTUP_RECORDS,
  findStartupRecord: (recognitionNumber) => {
    if (!recognitionNumber) return null;
    const clean = recognitionNumber.trim().toUpperCase();
    return SYNTHETIC_STARTUP_RECORDS.find(r => r.recognitionNumber === clean || r.panNumber === clean) || null;
  },
  findStartupByPan: (pan) => {
    if (!pan) return null;
    const cleanPan = pan.trim().toUpperCase();
    return SYNTHETIC_STARTUP_RECORDS.find(r => r.panNumber === cleanPan) || null;
  }
};
