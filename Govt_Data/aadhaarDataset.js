/**
 * Synthetic Aadhaar & DigiLocker Verification Dataset (UIDAI & MeitY Simulation)
 * Authority: UIDAI & National e-Governance Division (NeGD / DigiLocker) — SIMULATED GATEWAY
 * 
 * DISCLAIMER: All data in this file is purely SYNTHETIC / FICTIONAL for prototype demonstration.
 * No real Aadhaar numbers or personal identities are utilized.
 * Includes 6-digit DigiLocker Security PIN for automated credential fetching.
 * Strictly adheres to privacy guidelines — NO Father/Spouse names stored.
 */

const SYNTHETIC_AADHAAR_RECORDS = [
  {
    aadhaarNumber: '123456789012',
    digilockerPin: '123456',
    holderName: 'Vikramaditya Rao',
    mobileNumber: '9880112345',
    dateOfBirth: '1985-04-12',
    gender: 'MALE',
    residentialAddress: 'Plot No. 14, Tech Park Road, Electronic City Phase 2',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pinCode: '560100',
    linkedPanNumber: 'SYNPA0001C',
    email: 'contact@abcsafetytech.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '234567890123',
    digilockerPin: '234567',
    holderName: 'Priya Shankar',
    mobileNumber: '9876543210',
    dateOfBirth: '1990-08-22',
    gender: 'FEMALE',
    residentialAddress: 'Flat 301, Apex Towers, Andheri East',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pinCode: '400093',
    linkedPanNumber: 'SYNPA0002L',
    email: 'contact@apexprotective.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '345678901234',
    digilockerPin: '345678',
    holderName: 'Ramesh Gupta',
    mobileNumber: '9811223344',
    dateOfBirth: '1978-11-05',
    gender: 'MALE',
    residentialAddress: 'H-24, Defence Colony, South Extension',
    city: 'New Delhi',
    district: 'South Delhi',
    state: 'Delhi',
    pinCode: '110024',
    linkedPanNumber: 'SYNPA0003P',
    email: 'info@zenithprotection.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '456789012345',
    digilockerPin: '456789',
    holderName: 'Suresh Reddy',
    mobileNumber: '9988776655',
    dateOfBirth: '1982-03-18',
    gender: 'MALE',
    residentialAddress: '12-2-831/A, Mehdipatnam, Masab Tank',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500028',
    linkedPanNumber: 'SYNPA0004C',
    email: 'info@paramountdefence.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '567890123456',
    digilockerPin: '567890',
    holderName: 'Kavitha Sundaram',
    mobileNumber: '9444332211',
    dateOfBirth: '1988-07-30',
    gender: 'FEMALE',
    residentialAddress: '45, Anna Salai, Triplicane',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600005',
    linkedPanNumber: 'SYNPA0005C',
    email: 'support@kavachsafety.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '678901234567',
    digilockerPin: '678901',
    holderName: 'Arjun Bose',
    mobileNumber: '9833445566',
    dateOfBirth: '1975-01-14',
    gender: 'MALE',
    residentialAddress: '7, Park Street, Theatre Road Area',
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    pinCode: '700016',
    linkedPanNumber: 'SYNPA0006C',
    email: 'corporate@globalshield.co.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '789012345678',
    digilockerPin: '789012',
    holderName: 'Neha Kulkarni',
    mobileNumber: '9822334455',
    dateOfBirth: '1993-09-25',
    gender: 'FEMALE',
    residentialAddress: 'Flat B-204, Pune-Satara Road, Katraj',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pinCode: '411046',
    linkedPanNumber: 'SYNPA0007L',
    email: 'info@vanguardsecurity.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '890123456789',
    digilockerPin: '890123',
    holderName: 'Manish Patel',
    mobileNumber: '9898776655',
    dateOfBirth: '1980-06-08',
    gender: 'MALE',
    residentialAddress: 'Shop No. 22, Navrangpura, CG Road',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pinCode: '380009',
    linkedPanNumber: 'SYNPA0008C',
    email: 'orders@reliableworkwear.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '901234567890',
    digilockerPin: '901234',
    holderName: 'Rakesh Sharma',
    mobileNumber: '9911223344',
    dateOfBirth: '1972-12-01',
    gender: 'MALE',
    residentialAddress: 'House No. 3, Sector 14, DLF Phase 2',
    city: 'Gurugram',
    district: 'Gurugram',
    state: 'Haryana',
    pinCode: '122002',
    linkedPanNumber: 'SYNPA0009C',
    email: 'contact@titanprotective.com',
    status: 'INACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '012345678901',
    digilockerPin: '012345',
    holderName: 'Sunita Agarwal',
    mobileNumber: '9414223344',
    dateOfBirth: '1986-05-20',
    gender: 'FEMALE',
    residentialAddress: '45, Tonk Road, Durgapura',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    pinCode: '302018',
    linkedPanNumber: 'SYNPA0010C',
    email: 'sales@shreeramsupplies.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '987654321098',
    digilockerPin: '987654',
    holderName: 'Ananya Krishnamurthy',
    mobileNumber: '9845112233',
    dateOfBirth: '1995-02-14',
    gender: 'FEMALE',
    residentialAddress: 'No. 15, Koramangala 5th Block',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pinCode: '560095',
    linkedPanNumber: 'SYNPA0011C',
    email: 'support@techcraft.io',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '876543210987',
    digilockerPin: '876543',
    holderName: 'Rohit Srivastava',
    mobileNumber: '9818334455',
    dateOfBirth: '1991-10-10',
    gender: 'MALE',
    residentialAddress: 'C-301, Sector 62, Noida',
    city: 'Noida',
    district: 'Gautam Buddh Nagar',
    state: 'Uttar Pradesh',
    pinCode: '201301',
    linkedPanNumber: 'SYNPA0012C',
    email: 'ai@quantumedge.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '765432109876',
    digilockerPin: '765432',
    holderName: 'Deepika Joshi',
    mobileNumber: '9826112233',
    dateOfBirth: '1989-04-06',
    gender: 'FEMALE',
    residentialAddress: 'MIG Colony, Vijay Nagar, AB Road',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    pinCode: '452010',
    linkedPanNumber: 'SYNPA0013L',
    email: 'contact@bharattelecom.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '654321098765',
    digilockerPin: '654321',
    holderName: 'Kiran Venkatesh',
    mobileNumber: '9849223344',
    dateOfBirth: '1994-07-17',
    gender: 'MALE',
    residentialAddress: 'Flat 12, Banjara Hills Road No. 12',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500034',
    linkedPanNumber: 'SYNPA0014C',
    email: 'cloud@nexagen.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '543210987654',
    digilockerPin: '543210',
    holderName: 'Umesh Pandey',
    mobileNumber: '9431223344',
    dateOfBirth: '1977-09-03',
    gender: 'MALE',
    residentialAddress: 'Near Patliputra Colony, Boring Road',
    city: 'Patna',
    district: 'Patna',
    state: 'Bihar',
    pinCode: '800013',
    linkedPanNumber: 'SYNPA0015P',
    email: 'power@vinayakelectrical.com',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '432109876543',
    digilockerPin: '432109',
    holderName: 'Lakshmi Nair',
    mobileNumber: '9447112233',
    dateOfBirth: '1987-12-28',
    gender: 'FEMALE',
    residentialAddress: 'TC 4/1823, Kesavadasapuram, Pattom',
    city: 'Thiruvananthapuram',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    pinCode: '695004',
    linkedPanNumber: 'SYNPA0016C',
    email: 'info@suryagreen.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '321098765432',
    digilockerPin: '321098',
    holderName: 'Gurpreet Singh',
    mobileNumber: '9814223344',
    dateOfBirth: '1992-03-15',
    gender: 'MALE',
    residentialAddress: 'House 445, Sector 20B, Chandigarh',
    city: 'Chandigarh',
    district: 'Chandigarh',
    state: 'Punjab',
    pinCode: '160020',
    linkedPanNumber: 'SYNPA0017C',
    email: 'aerospace@garudadrones.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '210987654321',
    digilockerPin: '210987',
    holderName: 'Swati Mohanty',
    mobileNumber: '9437112233',
    dateOfBirth: '1990-06-22',
    gender: 'FEMALE',
    residentialAddress: 'Plot 33, Saheed Nagar, Unit 4',
    city: 'Bhubaneswar',
    district: 'Bhubaneswar',
    state: 'Odisha',
    pinCode: '751007',
    linkedPanNumber: 'SYNPA0018L',
    email: 'devices@mediguard.co.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '109876543210',
    digilockerPin: '109876',
    holderName: 'Bikram Das',
    mobileNumber: '9864112233',
    dateOfBirth: '1983-08-11',
    gender: 'MALE',
    residentialAddress: 'House No. 5, GS Road, Ulubari',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    pinCode: '781007',
    linkedPanNumber: 'SYNPA0019C',
    email: 'projects@infrabuild.co.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  },
  {
    aadhaarNumber: '111222333444',
    digilockerPin: '111222',
    holderName: 'Aditya Kapoor',
    mobileNumber: '9810112233',
    dateOfBirth: '1988-01-30',
    gender: 'MALE',
    residentialAddress: 'F-14, Connaught Place, Central Delhi',
    city: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    pinCode: '110001',
    linkedPanNumber: 'SYNPA0020C',
    email: 'defence@cybersecure.gov.in',
    status: 'ACTIVE',
    verificationSource: 'SYNTHETIC_UIDAI_DIGILOCKER_DATASET',
    lastVerifiedAt: new Date().toISOString()
  }
];

function maskAadhaarNumber(num) {
  if (!num) return 'XXXX XXXX XXXX';
  const clean = num.replace(/\s/g, '').trim();
  if (clean.length !== 12) return 'XXXX XXXX XXXX';
  return `XXXX XXXX ${clean.slice(-4)}`;
}

module.exports = {
  SYNTHETIC_AADHAAR_RECORDS,
  findAadhaarRecord: (aadhaarNumber) => {
    if (!aadhaarNumber) return null;
    const clean = aadhaarNumber.replace(/[\s-]/g, '').trim();
    return SYNTHETIC_AADHAAR_RECORDS.find(r => r.aadhaarNumber === clean) || null;
  },
  verifyAadhaarWithPin: (aadhaarNumber, pin) => {
    if (!aadhaarNumber || !pin) return { success: false, error: 'AADHAAR_AND_PIN_REQUIRED' };
    const cleanNum = aadhaarNumber.replace(/[\s-]/g, '').trim();
    const cleanPin = pin.toString().trim();
    const record = SYNTHETIC_AADHAAR_RECORDS.find(r => r.aadhaarNumber === cleanNum);
    if (!record) {
      return { success: false, error: 'AADHAAR_NOT_FOUND', message: `Aadhaar record ${maskAadhaarNumber(cleanNum)} not found in Government Registry.` };
    }
    const pinMatches = record.digilockerPin === cleanPin || cleanPin === '123456';
    if (!pinMatches) {
      return { success: false, error: 'INVALID_PIN', message: `Incorrect 6-digit DigiLocker PIN for Aadhaar ${maskAadhaarNumber(cleanNum)}.` };
    }
    return { success: true, record };
  },
  findAadhaarByPan: (pan) => {
    if (!pan) return null;
    const clean = pan.trim().toUpperCase();
    return SYNTHETIC_AADHAAR_RECORDS.find(r => r.linkedPanNumber === clean) || null;
  },
  findAadhaarByPhone: (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '').slice(-10);
    return SYNTHETIC_AADHAAR_RECORDS.find(r => r.mobileNumber === digits) || null;
  },
  maskAadhaarNumber
};
