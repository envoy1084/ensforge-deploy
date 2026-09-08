---
"@ensforge/contracts": minor
"@ensforge/core": minor
"@ensforge/hca": minor
"@ensforge/sdk": minor
---

Add fixed-policy HCA destination sessions and a Rhinestone execution adapter. Core exposes owner
enablement, bounded refunds, enabled-status reads and confirmed session references. Session plans
validate complete calldata and reconcile expiry, replacement and nonce revocation.

The optional Rhinestone subpath requires SDK 1.8.0 with the shipped compatibility patch. It supports
prefunded same-chain destination execution, SDK signing, on-chain signature verification and
restorable public intent tracking. Hosted relayer settlement remains a release verification step.
