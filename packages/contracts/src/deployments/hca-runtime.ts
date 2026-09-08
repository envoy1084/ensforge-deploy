/** Compiler immutable-reference offsets from the pinned StandaloneHCAImplementation artifact.
 * Template hash excludes the 53-byte Solidity metadata trailer and zero-fills immutable words.
 * The pinned image differs from Sepolia only in its metadata hash, not executable instructions.
 * The default validator has no public getter and is not part of Nexus's installed-validator list.
 */
export const hcaImplementationRuntime = {
  metadataBytes: 53,
  runtimeBytes: 21632,
  templateHash: "0x85419472040278bfde2060abf1bdec7199bf3b04e87e8386ae8705374bfe09eb",
  immutableWordOffsets: [
    1670, 2678, 3193, 3589, 3664, 5194, 6354, 7211, 7341, 7847, 2870, 3064, 6267, 9676, 3486, 11739,
    11790, 10648, 13448, 16262, 16297, 16377, 16415, 16229, 1087, 13938, 1622, 8391,
  ],
  defaultValidatorWordOffsets: [2870, 3064, 6267, 9676],
} as const;
