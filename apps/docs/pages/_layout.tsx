import type { ReactNode } from "react";

import { Analytics } from "../components/analytics/analytics.client";

export default function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <Analytics />
      {children}
    </>
  );
}
