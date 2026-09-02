/**
 * Synthetic Bureau of Indian Standards (BIS) & Quality Certification Dataset
 * Synchronized with 20 master corporate identities.
 * DISCLAIMER: Purely SYNTHETIC / FICTIONAL data for prototype demonstration.
 */

const { SYNTHETIC_PAN_RECORDS } = require('./panDataset');

const BIS_DATA_BY_PAN = {
  'SYNPA0001C': { cert: 'CM/L-8899001', product: 'Industrial Safety Helmets & Eye Protectors', isCode: 'IS 2925:1984 / IS 5983', status: 'ACTIVE' },
  'SYNPA0002L': { cert: 'CM/L-8899002', product: 'Industrial Safety Footwear', isCode: 'IS 15298 (Part 2):2016', status: 'ACTIVE' },
  'SYNPA0003P': { cert: 'CM/L-8899003', product: 'Fire Protection Suits', isCode: 'IS 15648:2006', status: 'EXPIRED' },
  'SYNPA0004C': { cert: 'CM/L-8899004', product: 'Ballistic Helmets & Tactical Body Armour', isCode: 'IS 17051:2018', status: 'ACTIVE' },
  'SYNPA0005C': { cert: 'CM/L-8899005', product: 'Industrial Full Body Harness & Fall Arrest Lifelines', isCode: 'IS 3521 (Part 1):2021', status: 'ACTIVE' },
  'SYNPA0006C': { cert: 'CM/L-8899006', product: 'Perimeter Security Hardware', isCode: 'IS 9000:2002', status: 'REVOKED' },
  'SYNPA0007L': { cert: 'CM/L-8899007', product: 'Smart Access Control Panels', isCode: 'IS 13252 (Part 1):2010', status: 'ACTIVE' },
  'SYNPA0008C': { cert: 'CM/L-8899008', product: 'Flame Retardant Protective Clothing', isCode: 'IS 15748:2007', status: 'ACTIVE' },
  'SYNPA0009C': { cert: 'CM/L-8899009', product: 'Machinery Safety Guards', isCode: 'IS 11000:2000', status: 'CANCELLED' },
  'SYNPA0010C': { cert: 'CM/L-8899010', product: 'Industrial Safety Goggles & Face Shields', isCode: 'IS 8521:1977', status: 'ACTIVE' },
  'SYNPA0011C': { cert: 'CM/L-8899011', product: 'Information Technology Equipment & Server Racks', isCode: 'IS 13252 (Part 1):2010', status: 'ACTIVE' },
  'SYNPA0012C': { cert: 'CM/L-8899012', product: 'AI Computing Appliances & Cryptographic Units', isCode: 'IS 13252 (Part 1):2010', status: 'ACTIVE' },
  'SYNPA0013L': { cert: 'CM/L-8899013', product: 'Optical Fibre Cables for Underground Duct Installation', isCode: 'IS 14435:1997', status: 'ACTIVE' },
  'SYNPA0014C': { cert: 'CM/L-8899014', product: 'Data Center Power Distribution Units', isCode: 'IS 616:2017', status: 'ACTIVE' },
  'SYNPA0015P': { cert: 'CM/L-8899015', product: 'Outdoor Distribution Transformers 11kV', isCode: 'IS 1180 (Part 1):2014', status: 'ACTIVE' },
  'SYNPA0016C': { cert: 'CM/L-8899016', product: 'Crystalline Silicon Terrestrial Photovoltaic (PV) Modules', isCode: 'IS 14286:2010', status: 'ACTIVE' },
  'SYNPA0017C': { cert: 'CM/L-8899017', product: 'UAV Avionics, Electronic Speed Controllers & Battery Packs', isCode: 'IS 16046 (Part 2):2018', status: 'ACTIVE' },
  'SYNPA0018L': { cert: 'CM/L-8899018', product: 'Medical Electrical Equipment Safety & Patient Monitors', isCode: 'IS 13450 (Part 1):2018', status: 'ACTIVE' },
  'SYNPA0019C': { cert: 'CM/L-8899019', product: 'Structural Steel for Concrete Reinforcement', isCode: 'IS 1786:2008', status: 'ACTIVE' },
  'SYNPA0020C': { cert: 'CM/L-8899020', product: 'National Defence Secure Communication Appliances', isCode: 'IS 13252 / Defence Spec 101', status: 'ACTIVE' }
};

const SYNTHETIC_BIS_RECORDS = SYNTHETIC_PAN_RECORDS.map((rec) => {
  const bis = BIS_DATA_BY_PAN[rec.panNumber];
  return {
    certificateNumber: bis.cert,
    organisationName: rec.legalName,
    panNumber: rec.panNumber,
    certificationType: 'ISI_MARK_CERTIFICATION',
    productCategory: bis.product,
    standardCode: bis.isCode,
    issueDate: '2020-05-15',
    expiryDate: bis.status === 'EXPIRED' ? '2023-05-14' : '2028-05-14',
    certificateStatus: bis.status,
    issuingAuthority: 'Bureau of Indian Standards, Central Testing Laboratory',
    verificationSource: 'SYNTHETIC_BIS_MANAK_ONLINE',
    lastVerifiedAt: new Date().toISOString(),
  };
});

module.exports = {
  SYNTHETIC_BIS_RECORDS,
  findBisRecord: (certNo) => {
    if (!certNo) return null;
    const clean = certNo.trim().toUpperCase();
    return SYNTHETIC_BIS_RECORDS.find(r => r.certificateNumber === clean || r.panNumber === clean) || null;
  }
};
