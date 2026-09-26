/** ERC-165 interface identifiers for ENSv2 resolver families. */
export const resolverInterfaceIds = {
  permissionedResolver: "0x8c2427cc",
} as const;

export type ResolverInterfaceId = (typeof resolverInterfaceIds)[keyof typeof resolverInterfaceIds];
