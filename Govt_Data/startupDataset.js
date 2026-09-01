/**
 * Synthetic Startup India / DPIIT Recognition Dataset
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const SYNTHETIC_STARTUP_RECORDS = [
  {
    recognitionNumber: 'DIPP10001',
    startupName: 'Apex Industrial Protective Equipments LLP',
    panNumber: 'SYNPA0002L',
    incorporationDate: '2019-11-20',
    recognitionDate: '2020-03-15',
    sector: 'Safety & Industrial Automation',
    startupStatus: 'RECOGNIZED_STARTUP',
    recognitionStatus: 'ACTIVE',
    validity: 'VALID_TILL_2029',
    exemptionsEligible: ['PRIOR_EXPERIENCE_EXEMPTION', 'TURNOVER_EXEMPTION', 'EMD_EXEMPTION'],
    state: 'Maharashtra',
    verificationSource: 'SYNTHETIC_DPIIT_STARTUP_INDIA',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    recognitionNumber: 'DIPP10007',
    startupName: 'Vanguard Security Works LLP',
    panNumber: 'SYNPA0007L',
    incorporationDate: '2021-08-30',
    recognitionDate: '2021-12-05',
    sector: 'Physical Security & Smart IoT',
    startupStatus: 'RECOGNIZED_STARTUP',
    recognitionStatus: 'ACTIVE',
    validity: 'VALID_TILL_2031',
    exemptionsEligible: ['PRIOR_EXPERIENCE_EXEMPTION', 'TURNOVER_EXEMPTION', 'EMD_EXEMPTION'],
    state: 'Maharashtra',
    verificationSource: 'SYNTHETIC_DPIIT_STARTUP_INDIA',
    lastVerifiedAt: new Date().toISOString(),
  },
];

module.exports = {
  SYNTHETIC_STARTUP_RECORDS,
  findStartupRecord: (recognitionNumber) => {
    if (!recognitionNumber) return null;
    const clean = recognitionNumber.trim().toUpperCase();
    return SYNTHETIC_STARTUP_RECORDS.find(r => r.recognitionNumber === clean) || null;
  },
  findStartupByPan: (pan) => {
    if (!pan) return null;
    const cleanPan = pan.trim().toUpperCase();
    return SYNTHETIC_STARTUP_RECORDS.find(r => r.panNumber === cleanPan) || null;
  }
};
