# Rhinestone 1.8.0 compatibility patch

`rhinestone-sdk-1.8.0.patch` starts with the ENS integration patch from
[`ensdomains/contracts-v2` at `09bf3ac`](https://github.com/ensdomains/contracts-v2/blob/09bf3ac64a6fb1b215573c019b17e8c501bb3ca0/patches/%40rhinestone%252Fsdk%401.8.0.patch).
The upstream SDK is MIT licensed; the ENS repository is MIT licensed.

ENSforge appends one extension: standalone HCA account configuration accepts `intentExecutor`, and
`getIntentExecutor` uses it when supplied. ENSforge always supplies the executor from the verified
HCA deployment profile. Stock SDK constants cannot represent the local deployment's executor and
would sign the wrong EIP-712 domain. This does not change the signature encoding or fixed policy.

Both executable JavaScript and TypeScript declarations are patched. The workspace applies the patch
through `pnpm-workspace.yaml`; package consumers must apply it too. Optional peer dependencies do not
apply patches in the consuming project. See [installation](../RHINESTONE.md#installation).

Rhinestone 2.13.0 was inspected during compatibility verification and did not contain this standalone account generation.
Do not upgrade or remove this patch until derivation, session signatures and deployment compatibility
have been verified against the new release.
