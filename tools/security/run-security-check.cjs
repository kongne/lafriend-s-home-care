/**
 * Unified orchestrator for running security checks locally.
 * Runs dependency vulnerability check (npm audit), checks for Semgrep availability,
 * and runs our static analysis scanner.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🛡️  Starting LaFriend\'s Home Care Local Security Checks...\n');

let failed = false;

// 1. Run Dependency Audit
console.log('-----------------------------------------');
console.log('📦 Step 1: Running Dependency Audit...');
console.log('-----------------------------------------');
try {
  // Use --audit-level=high so moderate ones don't break local development builds, but high/critical do.
  // Using --omit=dev to audit production dependencies only.
  execSync('npm audit --omit=dev --audit-level=high', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
  console.log('\n✅ Dependency Audit: Passed (no high or critical vulnerabilities).\n');
} catch (error) {
  console.error('\n❌ Dependency Audit: Failed (high or critical vulnerabilities found).\n');
  failed = true;
}

// 2. Run Semgrep check (if available)
console.log('-----------------------------------------');
console.log('🔍 Step 2: Checking for Semgrep Scan...');
console.log('-----------------------------------------');
let semgrepAvailable = false;
try {
  execSync('semgrep --version', { stdio: 'ignore' });
  semgrepAvailable = true;
} catch (e) {
  // Semgrep not in system path, check if WSL has it
  try {
    execSync('wsl semgrep --version', { stdio: 'ignore' });
    semgrepAvailable = true;
    console.log('ℹ️  Semgrep found inside WSL environment. Will run scan via WSL.');
  } catch (wslErr) {
    // Not found in WSL either
  }
}

if (semgrepAvailable) {
  try {
    console.log('🚀 Running Semgrep static scan...');
    const command = process.platform === 'win32' && !hasDirectSemgrep() ? 'wsl semgrep scan --config=auto' : 'semgrep scan --config=auto';
    execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
    console.log('\n✅ Semgrep scan completed successfully.\n');
  } catch (error) {
    console.error('\n❌ Semgrep scan detected security issues.\n');
    failed = true;
  }
} else {
  console.log('ℹ️  Semgrep is not installed on this system. Skipping Semgrep scan.');
  console.log('💡 Tip: Semgrep can be installed via WSL or Docker on Windows for deeper scans.\n');
}

function hasDirectSemgrep() {
  try {
    execSync('semgrep --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// 3. Run Custom Static Scanner
console.log('-----------------------------------------');
console.log('🔎 Step 3: Running Static Code Scanning...');
console.log('-----------------------------------------');
try {
  execSync('node tools/security/scan-code.cjs', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
  console.log('✅ Static Code Scan: Completed.\n');
} catch (error) {
  console.error('\n❌ Static Code Scan: Failed (detected critical/high security patterns).\n');
  failed = true;
}

// Final status report
console.log('=========================================');
if (failed) {
  console.error('🚨 LOCAL SECURITY SCAN: FAILED. Please fix the issues above before committing.');
  console.log('=========================================\n');
  process.exit(1);
} else {
  console.log('✨ LOCAL SECURITY SCAN: PASSED! Codebase is secure.');
  console.log('=========================================\n');
  process.exit(0);
}
