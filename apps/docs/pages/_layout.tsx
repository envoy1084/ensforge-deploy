import type { ReactNode } from "react";

import { SiteEffects } from "../components/site-effects.client";

export default function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <SiteEffects />
      {children}
    </>
  );
}
