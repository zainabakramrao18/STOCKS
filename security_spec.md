# StockWise Security Specification

## 1. Data Invariants
- Every document in `/users/{userId}/...` must strictly belong to the authenticated user matching `request.auth.uid == userId`.
- Product quantity, costPrice, sellingPrice, and reorderLevel must be non-negative numbers.
- Transaction records must be immutable once created, ensuring the audit trail of sales and restocks cannot be tampered with.
- A user cannot read, create, update, or delete products or transactions belonging to another shop owner.
- String boundaries (maxLength) must be enforced across all inputs to prevent Denial-of-Wallet or storage injection attacks.
- Only authenticated users with verified identities (`request.auth.uid != null`) can perform reads and writes to their own subcollections.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Read**: Attempting to read `/users/user123/products/prod1` without an auth token.
2. **Cross-Tenant Product Injection**: User `attacker456` attempting to create a product in `/users/victim123/products/prod1`.
3. **Spoofed Owner UID in Product Body**: User `victim123` attempting to write a product payload where `userId: "admin_impersonator"`.
4. **Negative Stock Quantity**: Creating or updating a product with `quantity: -15`.
5. **Negative Prices**: Creating a product with `costPrice: -50.00` or `sellingPrice: -100.00`.
6. **Oversized String Payload (Storage Bomb)**: Submitting a product name with 10,000 characters (exceeding maxLength 150).
7. **Invalid Path Injection (ID Poisoning)**: Writing to `/users/user123/products/../../evil_doc` or non-alphanumeric IDs.
8. **Tampering with Past Transaction**: Attempting an `update` on an existing sales record in `/users/user123/transactions/tx999`.
9. **Deleting an Audit Transaction**: Attempting to `delete` an audit transaction in `/users/user123/transactions/tx999`.
10. **Cross-User Transaction Logging**: Logging a sale under `/users/otherUser/transactions/tx001`.
11. **Negative Transaction Quantity**: Logging a sale or restock with `quantity: -5`.
12. **Foreign Setting Modification**: Modifying `/users/victimUser/settings/general` while authenticated as a different shopkeeper.
