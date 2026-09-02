/**
 * Automated Test Suite for COMPLYGeM Government Data Simulator
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:8001';

const testCases = [
  { name: 'Health Check', path: '/health', expectedStatus: 200, key: 'status', expectedVal: 'ONLINE' },
  { name: 'PAN Verification (Valid)', path: '/api/pan/SYNPA0001C', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'GSTIN Verification (Valid)', path: '/api/gst/29SYNPA0001C1Z5', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'Udyam Check (Valid)', path: '/api/udyam/UDYAM-KR-03-0012345', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'MCA21 Check (Valid)', path: '/api/mca/U29100KA2018PTC112233', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'EPFO Labor Check', path: '/api/epfo/KNBNG0012345000', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'ESIC Labor Check', path: '/api/esic/53000123450001001', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'NSIC SPR Limit Check', path: '/api/nsic/NSIC/REG/2021/8892', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'Startup India Exemption', path: '/api/startup/DIPP-44912', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'DigiLocker Doc Check', path: '/api/digilocker/DL-DOC-001-SYNPA0001C', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'BIS Quality Standard', path: '/api/bis/CM/L-8899001', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'GeM Seller Rating Check', path: '/api/gem-seller/GEM-SELLER-1001', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'Make in India Local Content', path: '/api/local-content/MII-DECL-001', expectedStatus: 200, key: 'found', expectedVal: true },
  { name: 'CVC Debarment Check (Debarred)', path: '/api/blacklist/SYNPA0006C', expectedStatus: 200, key: 'is_debarred', expectedVal: true },
  { name: 'PAN Not Found Case', path: '/api/pan/INVALIDPAN99', expectedStatus: 404, key: 'found', expectedVal: false },
];

function runTest(tc) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${tc.path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const statusMatch = (res.statusCode === tc.expectedStatus);
          const valMatch = (json[tc.key] === tc.expectedVal);
          const passed = statusMatch && valMatch;

          if (passed) {
            console.log(`  ✓ [PASS] ${tc.name} (${res.statusCode})`);
          } else {
            console.error(`  ✗ [FAIL] ${tc.name}: expected ${tc.expectedStatus}/${tc.expectedVal}, got ${res.statusCode}/${json[tc.key]}`);
          }
          resolve(passed);
        } catch (e) {
          console.error(`  ✗ [FAIL] ${tc.name}: JSON parse error`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`  ✗ [ERROR] ${tc.name}: ${err.message}`);
      resolve(false);
    });
  });
}

async function runAll() {
  console.log('====================================================');
  console.log('🧪 Running COMPLYGeM Government Data Simulator Tests');
  console.log('====================================================\n');

  let passed = 0;
  for (const tc of testCases) {
    const ok = await runTest(tc);
    if (ok) passed++;
  }

  console.log(`\nResults: ${passed}/${testCases.length} tests passed.`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runAll();
