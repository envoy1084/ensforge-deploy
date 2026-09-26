/** Resolver role bitmaps from ENSv2 PermissionedResolverLib. */
export const resolverRoles = {
  setAddr: 1n << 0n,
  setAddrAdmin: 1n << 128n,
  setText: 1n << 4n,
  setTextAdmin: 1n << 132n,
  setContenthash: 1n << 8n,
  setContenthashAdmin: 1n << 136n,
  setAbi: 1n << 12n,
  setAbiAdmin: 1n << 140n,
  setInterface: 1n << 16n,
  setInterfaceAdmin: 1n << 144n,
  setName: 1n << 20n,
  setNameAdmin: 1n << 148n,
  link: 1n << 28n,
  linkAdmin: 1n << 156n,
  setData: 1n << 24n,
  setDataAdmin: 1n << 152n,
  canName: 1n << 120n,
  canNameAdmin: 1n << 248n,
  upgrade: 1n << 124n,
  upgradeAdmin: 1n << 252n,
} as const;

export type ResolverRole = (typeof resolverRoles)[keyof typeof resolverRoles];
