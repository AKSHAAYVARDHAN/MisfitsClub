# Security Specification: Role-Based Admin Access Control (RBAC)

## 1. Data Invariants
1. **Zero-Trust Identity**: User roles cannot be self-assigned in the client or inside `users/{uid}`. Privileged access is strictly evaluated from the authoritative server-side collection `/adminRoles/{uid}`.
2. **Access Hierarchy**:
   - `OWNER`: Full administrative privileges, role assignment/revocation, audit logs, system deletion.
   - `ADMIN`: Member management, content moderation, feedback/contact inquiry access, metrics.
   - `MODERATOR`: Content moderation (Sparks, Spaces, Posts), report handling.
   - `SUPPORT`: Feedback and contact inbox triage, status management.
   - `MEMBER`: Default member privileges with zero access to `/adminRoles`, `/feedback`, `/contactMessages`, or `/auditLogs`.
3. **Immutability of Audit Trails**: `/auditLogs/{logId}` documents can only be created by active staff members with `actorId == request.auth.uid`, and are strictly immutable (update: false, delete: false).
4. **PII and Inquiry Isolation**: Only authenticated staff with active status can read or update `/feedback` and `/contactMessages`. Public visitors and authenticated users can only create submissions conforming to strict length/type limits.
5. **No Client Role Injection**: The `users/{uid}` and `publicProfiles/{uid}` collections strictly forbid fields like `isAdmin`, `isStaff`, or `adminRole` from overriding authoritative Firestore rule checks.

---

## 2. The "Dirty Dozen" Vulnerability Payloads

| # | Attack Scenario | Target Path | Malicious Payload / Action | Expected Result |
|---|---|---|---|---|
| 1 | **Self-Promotion to Owner** | `/adminRoles/attacker_uid` | Create `{ uid: "attacker_uid", role: "OWNER" }` as non-owner | `PERMISSION_DENIED` |
| 2 | **Role Elevation via User Profile** | `/users/attacker_uid` | Update `{ role: "OWNER", isAdmin: true }` | Ignored by rules / No RBAC effect |
| 3 | **Anonymous Feedback Scraping** | `/feedback` | List/Get all user feedback submissions | `PERMISSION_DENIED` |
| 4 | **Contact Inquiries Snoop** | `/contactMessages` | List/Get all direct contact inquiries as standard user | `PERMISSION_DENIED` |
| 5 | **Tampering with Audit Logs** | `/auditLogs/log_123` | Update `{ action: "REVERTED", details: "tampered" }` | `PERMISSION_DENIED` |
| 6 | **Audit Log Deletion** | `/auditLogs/log_123` | Delete document to hide trace | `PERMISSION_DENIED` |
| 7 | **Mass Junk Feedback Injection** | `/feedback/spam_1` | Create with `content` of 500,000 characters | `PERMISSION_DENIED` (Exceeds size limit) |
| 8 | **Moderator Assigning Owner Role** | `/adminRoles/target_uid` | Update role to `OWNER` by non-owner staff | `PERMISSION_DENIED` |
| 9 | **Suspended Staff Escalation** | `/adminRoles/suspended_uid` | Access `/feedback` when `status: 'suspended'` | `PERMISSION_DENIED` |
| 10 | **ID Poisoning on Admin Document** | `/adminRoles/../../malicious` | Create role with invalid character IDs | `PERMISSION_DENIED` |
| 11 | **Public Listing of Staff Roles** | `/adminRoles` | Query `/adminRoles` as non-staff member | `PERMISSION_DENIED` |
| 12 | **Ghost Field Injection in Contact** | `/contactMessages/msg_1` | Create with extra field `{ isVerifiedStaff: true }` | `PERMISSION_DENIED` (Strict schema) |

---

## 3. Test Runner & Verification Logic
All security rule changes are verified against the above invariants and checked with ESLint and the Firebase deployment pipeline.
