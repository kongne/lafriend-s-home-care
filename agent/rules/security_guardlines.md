# LaFriend's Home Care Security Guidelines & Workflow

These guidelines outline the mandatory security practices for developers working on the LaFriend's Home Care codebase.

## 1. Local Security Workflow

To ensure that the codebase remains secure, developers must run the local security suite before committing changes.

### Running Checks
Run the consolidated security check command from the root of the project:
```bash
npm run security-check
```

This command runs:
1. **Dependency Audit**: Checks dependencies for known high/critical vulnerabilities using `npm audit`.
2. **Semgrep Check**: Scans for weak code syntax and configuration patterns using Semgrep (if installed).
3. **Static Code Scan**: Runs a custom JS-based static scan (`tools/security/scan-code.js`) checking for hardcoded credentials and specific vulnerabilities.

---

## 2. Hardcoded Secrets Policy

* **No Credentials in Code**: Never hardcode API keys, service role keys, SMTP passwords, database connection strings, or private tokens in source code.
* **Environment Variables**: Use `.env` for local configuration. Ensure `.env` is listed in `.gitignore` and never committed.
* **Server Secrets**: Secrets for Supabase Edge Functions (e.g. `GMAIL_APP_PASSWORD`, `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY`) must be configured via the Supabase CLI (`supabase secrets set`) or the Supabase dashboard.
* **Client Exposure**: Never reference the Supabase `SERVICE_ROLE_KEY` or any admin credentials in frontend (`src/`) files.

---

## 3. Row-Level Security (RLS) & Views

* **Enable RLS**: Every table in the `public` schema of the database must have Row-Level Security enabled.
* **Least Privilege**: Avoid creating general "authenticated user" read/write policies. Policies should explicitly bind actions to `auth.uid() = user_id` for customers.
* **Separate Admin Policies**: Keep customer and admin policies separate. Do not combine them with `OR` clauses that might create access control gaps.
* **Data Minimization (Views)**: If customers need to access data from tables containing sensitive fields (like compensation, phone numbers, or email of staff), create a database view (e.g., `staff_members_public`) that excludes those columns, and query the view in customer-facing frontend components.

---

## 4. Supabase Edge Functions Protection

* **Authentication Requirements**: Edge functions must be authenticated by default.
* **JWT Settings**:
  * Set `verify_jwt = true` in `supabase/config.toml` if authorization is handled entirely by the Supabase gateway.
  * If `verify_jwt = false` is used (e.g., for functions that need custom handling, public access under conditions, or are triggered via webhook/cron), the function code MUST programmatically call `verifyJwt(req)` or `verifyCronSecret(req)`.
* **Public Access**: Any publicly accessible function must validate input strictly (using Zod schemas), implement rate limiting (`checkRateLimit`), and sanitize input.

---

## 5. Input Validation & Sanitization

* **Zod Validation**: Parse all payloads received from clients or edge function requests using strict Zod schemas.
* **XSS Prevention**:
  * Never use `dangerouslySetInnerHTML` unless input is explicitly sanitized by a trusted HTML sanitizer library.
  * Clean user input strings to strip potential HTML/script tags (e.g., using `sanitizeString` helper).
  * Always escape user data printed in emails or HTML templates using `escapeHtml`.
