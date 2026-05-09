# Esaku Platform Audit & Security Report

**Date:** 2026-05-10
**Audit Scope:** Functional Bugs, Security Exploits, UI/UX Consistency, Network Analysis.

---

## 1. Critical Security Vulnerabilities

### [HIGH] Stored Cross-Site Scripting (XSS) in User Profile Name
- **Description:** The `name` field during sign-up or profile update is not sanitized on the backend or escaped on the frontend before being rendered via `innerHTML`.
- **Exploit:** An attacker can sign up with a name like `<img src=x onerror=alert('XSS')>`.
- **Impact:** 
    - **Self-XSS:** Executes in the user's dashboard (user pill).
    - **Stored XSS:** Executes in the **Admin CMS** when an admin views the user list. This could allow an attacker to steal admin session cookies or perform actions on behalf of the admin.
- **Confirmed in:** `shell.js` (navHTML), `admin.html` (user table rendering).

### [MEDIUM] Weak CSRF Protection
- **Description:** The session cookie `esaku_session` uses `SameSite=Lax`. While this prevents some CSRF attacks, it does not provide full protection for state-changing requests (POST/PUT/DELETE) if the browser is older or if there are subdomains.
- **Recommendation:** Implement CSRF tokens or set `SameSite=Strict` if no cross-site navigation is required.

---

## 2. Functional Bugs & Technical Issues

### [FIXED] 500 Error in QRIS Mock Payment (SQLite)
- **Issue:** The `/api/qris/[id]/mock-pay` endpoint used `FOR UPDATE` in its SQL query.
- **Cause:** `FOR UPDATE` is a MySQL-specific syntax and causes a syntax error in SQLite.
- **Resolution:** Modified the query to conditionally include `FOR UPDATE` only when `DB_CLIENT` is `mysql`.

### [LOW] Noisy 401 Errors in Console
- **Issue:** The `/api/auth/me` endpoint returns a `401 Unauthorized` for guest users.
- **Observation:** Since the frontend (shell.js) calls this on every page to check login status, the browser console shows a red error on every visit for non-logged-in users.
- **Recommendation:** Return `200 OK` with `{ "user": null }` instead of 401 for this specific "status check" endpoint.

### [LOW] Rate Limiting Threshold
- **Issue:** The current rate limit is 100 requests per 15 minutes.
- **Risk:** Legitimate users with multiple tabs open might hit this limit due to the 15-second notification polling.

---

## 3. UI/UX Observations

### [LOW] Missing Favicon
- **Issue:** Browser console reports 404 for `favicon.ico`.
- **Resolution:** Added a favicon link in HTML, but the physical file might be missing or misplaced.

---

## 4. Network Analysis (Inspect Element)

- **Sensitive Data Leaks:** Initial scan shows no leakage of sensitive data (passwords, internal IDs) in public API responses.
- **Payload Inspection:**
    - Auth requests transmit passwords over JSON (Secure as long as HTTPS is used).
    - Transaction data correctly scopes to the logged-in user.
- **Headers:** `X-Powered-By: Express` is visible. (Security best practice: Disable this header).

---

## 5. Next Steps for Hardening

1. **[IMMEDIATE]** Implement HTML escaping in the frontend template literals.
2. **[IMMEDIATE]** Add backend validation for the `name` field to strip HTML tags.
3. **[Harden]** Set `X-Content-Type-Options: nosniff` and other security headers using `helmet`.
4. **[Harden]** Disable `X-Powered-By` header.
