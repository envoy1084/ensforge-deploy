---
"@ensforge/contracts": minor
"@ensforge/core": minor
---

Remove the obsolete DNS V1 mirror root batch registrar from deployment profiles and custom-network configuration. Devnet discovery requires RootBatchRegistrar, matching the post-audit-2 DNS deployment architecture. Historical deployed ABI exports remain unchanged.
