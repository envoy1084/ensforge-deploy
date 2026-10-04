---
"@ensforge/contracts": minor
"@ensforge/core": minor
"@ensforge/sdk": minor
"@ensforge/react": minor
"@ensforge/hca": minor
---

Migrate Sepolia ENSv2 to the October 1 deployment snapshot 07e55a05. Update contract addresses and deployed ABIs, export the ENS URI renderers and VerifiableFactory address prediction, and refresh the indexer schema and migration guides. Mainnet behavior is unchanged.

Support idempotent HCA deployment: preserve verification of existing accounts after deployment approval is revoked, reject unapproved new deployments, and report account reuse when deployments race. Recreate Sepolia fixtures and HCA accounts for the new factory, keeping workflow state separate from earlier deployments.

Update the pinned devnet build and preserve the deployed Solidity submodule revisions rather than replacing them with revisions from the stale upstream lockfile.
