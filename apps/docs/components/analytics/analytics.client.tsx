"use client";

import { useEffect } from "react";

import { getAnalytics } from "./client";
import { observeInteractions } from "./interactions";

export function Analytics() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void getAnalytics().then((client) => {
      if (client && !disposed) cleanup = observeInteractions();
      return undefined;
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return null;
}
