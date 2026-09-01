/**
 * Synthetic Authorized Government Procurement Officer Directory
 * DISCLAIMER: All records in this file are purely SYNTHETIC / FICTIONAL for prototype demonstration.
 */

const SYNTHETIC_OFFICER_DIRECTORY = [
  {
    employeeId: 'EMP-PWD-101',
    name: 'Rajesh Kumar (Synthetic)',
    email: 'officer@complygem.gov.in',
    organization: 'Central Public Works Department (CPWD)',
    department: 'Procurement & Tendering Wing',
    designation: 'Executive Engineer / Senior Procurement Officer',
    status: 'ACTIVE_AUTHORIZED',
    verificationSource: 'SYNTHETIC_OFFICER_HRMS_DIRECTORY',
  },
  {
    employeeId: 'EMP-RAIL-204',
    name: 'Priya Sharma (Synthetic)',
    email: 'priya.sharma@railways.gov.in',
    organization: 'Ministry of Railways',
    department: 'Stores & Material Management',
    designation: 'Principal Chief Materials Manager',
    status: 'ACTIVE_AUTHORIZED',
    verificationSource: 'SYNTHETIC_OFFICER_HRMS_DIRECTORY',
  },
  {
    employeeId: 'EMP-DEF-305',
    name: 'Col. Amit Verma (Synthetic)',
    email: 'amit.verma@defence.gov.in',
    organization: 'Ministry of Defence',
    department: 'Directorate General of Quality Assurance',
    designation: 'Director of Procurement',
    status: 'ACTIVE_AUTHORIZED',
    verificationSource: 'SYNTHETIC_OFFICER_HRMS_DIRECTORY',
  },
];

module.exports = {
  SYNTHETIC_OFFICER_DIRECTORY,
  findOfficerRecord: (employeeId) => {
    if (!employeeId) return null;
    const clean = employeeId.trim().toUpperCase();
    return SYNTHETIC_OFFICER_DIRECTORY.find(r => r.employeeId === clean) || null;
  }
};
