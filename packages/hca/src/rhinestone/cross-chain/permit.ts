import { parseAbi } from "viem";

/** Uniswap Permit2 ISignatureTransfer; independent of the ENS deployment ABI. */
export const permit2NonceAbi = parseAbi([
  "function nonceBitmap(address owner, uint256 wordPos) view returns (uint256)",
  "function invalidateUnorderedNonces(uint256 wordPos, uint256 mask)",
]);
