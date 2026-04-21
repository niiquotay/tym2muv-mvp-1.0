# Security Specification

## 1. Data Invariants
- A user can only access their own PII.
- A listing must belong to a valid agent/user, and `sellerId` must match the creator's UID.
- Payments must be securely logged and cannot be created or modified by clients directly (only admins or server integrations). A user can read their own payments.
- Only the creator (Tenant or Agent) or an Admin can modify non-immutable fields of their user profile.
- Agents can create, update, and delete their own listings.
- Customers/Tenants cannot create listings.
- Messages can only be read/written by participants in the chat.
- Reviews can only be created by the customer for an agent, and cannot be modified once created.
- Monetization ads can only be modified by admins.

## 2. The "Dirty Dozen" Payloads
1.  **Identity Spoofing**: `{"id":"myUid", "name":"Hacker", "role":"Admin"}` setting my own role to Admin.
2.  **Resource Poisoning**: `{ "id":"xyz...", "name": "a".repeat(2000), "role":"Tenant" }`
3.  **Shadow Update**: `{ "id":"uid123", "name":"Me", "role":"Tenant", "isVerified": true }` (injecting fields)
4.  **Date Poisoning**: `{ "id":"uid123", "name":"Me", "role":"Tenant", "memberSince": "1990-01-01" }`
5.  **Agent Spoofing**: User `tenant123` tries to create an `/agents/tenant123` profile.
6.  **Listing Spoofing**: Agent `agent123` creates listing with `sellerId: 'otherAgent'`.
7.  **Payment Manipulation**: User `user123` creates a `/payments/p1` with `status: "completed"`.
8.  **Message Peeking**: User `user1` trying to list messages in a chat where they aren't a participant.
9.  **Message Spoofing**: User `user1` sends message with `senderId: "user2"`.
10. **Review Tampering**: Customer `user1` tries to edit their review to a 1 star.
11. **Admin Override**: Regular user updating ad monetization metrics.
12. **Recursive Array**: Agent adding 500 images to a listing.

## 3. The Test Runner
A `firestore.rules.test.ts` will verify these using `@firebase/rules-unit-testing`.
