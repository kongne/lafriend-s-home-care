/**
 * Lightweight static security scanner for the LaFriend's Home Care project.
 * Scans codebase for hardcoded secrets, weak syntax patterns, and edge function configuration issues.
 */

const fs = require('fs');
const path = require('path');

// Patterns for hardcoded secrets, keys, and tokens
const SECRET_PATTERNS = [
  {
    name: 'Hardcoded Supabase Service Role Key / JWT',
    regex: /eyJhbGciOi[a-zA-Z0-9_\-]{30,}\.[a-zA-Z0-9_\-]{30,}/,
    severity: 'CRITICAL',
  },
  {
    name: 'Hardcoded Twilio Auth Token',
    regex: /(?:twilio_auth_token|twilio_sid|twilio_secret) *= *['"`][a-f0-9]{32}['"`]/i,
    severity: 'CRITICAL',
  },
  {
    name: 'Generic API Key / Secret Assignment',
    regex: /(?:api_key|apikey|secret|private_key|auth_token|access_token|gmail_app_password) *= *['"`][a-zA-Z0-9_\-\.\=\+]{16,}['"`]/i,
    severity: 'HIGH',
  },
  {
    name: 'Potential Private Key',
    regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
    severity: 'CRITICAL',
  },
  {
    name: 'Supabase Service Role reference in client code',
    regex: /SUPABASE_SERVICE_ROLE_KEY/i,
    severity: 'HIGH',
    fileFilter: (filePath) => {
      const normalized = filePath.replace(/\\/g, '/');
      return !normalized.includes('supabase/functions') && !normalized.includes('.env');
    },
    reason: 'Service role keys must never be referenced or used in frontend client-side code.',
  }
];

// Patterns for weak syntax or code vulnerabilities
const SYNTAX_PATTERNS = [
  {
    name: 'XSS Risk: dangerouslySetInnerHTML',
    regex: /dangerouslySetInnerHTML/i,
    severity: 'HIGH',
    reason: 'Direct usage of dangerouslySetInnerHTML bypasses React\'s built-in XSS protection.',
    fileFilter: (filePath) => !filePath.replace(/\\/g, '/').includes('src/components/ui/chart.tsx'),
    lineFilter: (line) => !line.includes('t(') && !line.includes('Object.entries(THEMES)') && !line.includes('__html:') && !line.includes('colorConfig'),
  },
  {
    name: 'Insecure Execution: eval()',
    regex: /\beval\s*\(/,
    severity: 'CRITICAL',
    reason: 'eval() allows execution of arbitrary code and is highly vulnerable to injection attacks.',
  },
  {
    name: 'Insecure Execution: Function() constructor',
    regex: /\bnew\s+Function\s*\(/,
    severity: 'HIGH',
    reason: 'Creating functions from strings is equivalent to eval() and poses injection risks.',
  }
];

// Directories to scan
const TARGET_DIRS = ['src', 'supabase/functions'];

// Extensions to scan
const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', '.lovable'];

// Global state
let exitCode = 0;
const results = {
  secrets: [],
  syntax: [],
  edgeFunctions: [],
};

// Main function to run the scanner
function runScanner() {
  console.log('🔍 Starting local security scan...');
  
  // 1. Scan codebase for secrets and weak syntax
  for (const dir of TARGET_DIRS) {
    const dirPath = path.resolve(__dirname, '../../', dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath);
    } else {
      console.warn(`⚠️ Warning: Directory ${dir} not found.`);
    }
  }

  // 2. Scan Supabase Edge Function configuration
  scanEdgeFunctionsConfig();

  // 3. Print Report
  printReport();

  process.exit(exitCode);
}

// Recursively scans a directory for files
function scanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.includes(file)) continue;
      scanDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (SCANNED_EXTENSIONS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

// Scans individual file content
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const relativePath = path.relative(path.resolve(__dirname, '../../'), filePath);

  // Skip the scanner scripts themselves
  if (relativePath.includes('tools/security')) return;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check Secrets
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.fileFilter && !pattern.fileFilter(filePath)) continue;
      
      const match = line.match(pattern.regex);
      if (match) {
        // Redact match for display
        const matchedStr = match[0];
        const redacted = matchedStr.length > 20 
          ? matchedStr.substring(0, 10) + '...' + matchedStr.substring(matchedStr.length - 5)
          : '[REDACTED]';

        results.secrets.push({
          file: relativePath.replace(/\\/g, '/'),
          line: lineNum,
          issue: pattern.name,
          match: redacted,
          severity: pattern.severity,
        });
        if (pattern.severity === 'CRITICAL' || pattern.severity === 'HIGH') {
          exitCode = 1;
        }
      }
    }

    // Check Syntax Issues
    for (const pattern of SYNTAX_PATTERNS) {
      if (pattern.fileFilter && !pattern.fileFilter(filePath)) continue;
      if (pattern.lineFilter && !pattern.lineFilter(line)) continue;
      if (line.match(pattern.regex)) {
        results.syntax.push({
          file: relativePath.replace(/\\/g, '/'),
          line: lineNum,
          issue: pattern.name,
          reason: pattern.reason,
          severity: pattern.severity,
          snippet: line.trim(),
        });
        if (pattern.severity === 'CRITICAL' || pattern.severity === 'HIGH') {
          exitCode = 1;
        }
      }
    }
  });
}

// Scans supabase/config.toml to verify JWT settings and implementation
function scanEdgeFunctionsConfig() {
  const configPath = path.resolve(__dirname, '../../supabase/config.toml');
  if (!fs.existsSync(configPath)) {
    console.log('ℹ️ No Supabase config.toml found to scan.');
    return;
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split(/\r?\n/);

  let currentFunction = null;
  const functionConfigs = {};

  lines.forEach((line) => {
    // Matches [functions.function-name]
    const sectionMatch = line.match(/^\s*\[functions\.([a-zA-Z0-9_\-]+)\]/);
    if (sectionMatch) {
      currentFunction = sectionMatch[1];
      functionConfigs[currentFunction] = { verify_jwt: true }; // default is true
    }

    // Matches verify_jwt = false/true
    const jwtMatch = line.match(/^\s*verify_jwt\s*=\s*(true|false)/);
    if (jwtMatch && currentFunction) {
      functionConfigs[currentFunction].verify_jwt = jwtMatch[1] === 'true';
    }
  });

  // Now, check implementations for verify_jwt = false functions
  for (const [funcName, config] of Object.entries(functionConfigs)) {
    if (funcName === 'verify-recaptcha') continue; // Intentionally public reCAPTCHA validation
    if (config.verify_jwt === false) {
      const funcImplPath = path.resolve(__dirname, '../../supabase/functions', funcName, 'index.ts');
      
      // Some internal functions might not need checks (e.g. appointment reminder scheduled tasks checked via cron secret)
      if (fs.existsSync(funcImplPath)) {
        const implContent = fs.readFileSync(funcImplPath, 'utf8');
        const hasJwtVerification = implContent.includes('verifyJwt') || implContent.includes('auth.getClaims');
        const hasCronSecretVerification = implContent.includes('verifyCronSecret') || implContent.includes('CRON_SECRET');

        if (!hasJwtVerification && !hasCronSecretVerification) {
          results.edgeFunctions.push({
            function: funcName,
            issue: 'JWT Verification Disabled & No Manual Auth Checks Found',
            severity: 'CRITICAL',
            reason: `Function '${funcName}' has verify_jwt = false in config.toml, but its implementation does not call 'verifyJwt' or 'verifyCronSecret'. It is publicly reachable without authentication.`,
          });
          exitCode = 1;
        }
      } else {
        results.edgeFunctions.push({
          function: funcName,
          issue: 'Missing Edge Function Implementation',
          severity: 'HIGH',
          reason: `Function '${funcName}' is configured in config.toml but no folder or index.ts exists at supabase/functions/${funcName}.`,
        });
      }
    }
  }
}

// Prints output results nicely
function printReport() {
  console.log('\n=========================================');
  console.log('🛡️  SECURITY STATIC SCAN REPORT');
  console.log('=========================================\n');

  let totalIssues = results.secrets.length + results.syntax.length + results.edgeFunctions.length;

  if (totalIssues === 0) {
    console.log('✅ PASS: No critical security issues or hardcoded secrets found.');
    return;
  }

  if (results.secrets.length > 0) {
    console.log(`🔑 Hardcoded Secrets / Key Exposure (${results.secrets.length}):`);
    results.secrets.forEach((s) => {
      console.log(`  [${s.severity}] ${s.file}:${s.line} - ${s.issue}`);
      console.log(`    Matched snippet: ${s.match}\n`);
    });
  }

  if (results.syntax.length > 0) {
    console.log(`⚠️  Weak Syntax Patterns / Code Security Risk (${results.syntax.length}):`);
    results.syntax.forEach((s) => {
      console.log(`  [${s.severity}] ${s.file}:${s.line} - ${s.issue}`);
      console.log(`    Reason: ${s.reason}`);
      console.log(`    Code: ${s.snippet}\n`);
    });
  }

  if (results.edgeFunctions.length > 0) {
    console.log(`🌐 Supabase Edge Function Security Issues (${results.edgeFunctions.length}):`);
    results.edgeFunctions.forEach((f) => {
      console.log(`  [${f.severity}] Function: ${f.function} - ${f.issue}`);
      console.log(`    Description: ${f.reason}\n`);
    });
  }

  console.log('-----------------------------------------');
  console.log(`🚨 Status: FAILED. Found ${totalIssues} security risk(s).`);
  console.log('=========================================\n');
}

runScanner();
