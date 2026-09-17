"use client";

import { useEffect } from "react";

/** Registers the offline service worker (production only). */
export default function RegisterSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is progressive — a failed registration is fine */
      });
    }
  }, []);
  return null;
}
