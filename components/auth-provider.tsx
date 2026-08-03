"use client";

import { useEffect } from "react";
import { subscribeToAuthChanges } from "@/lib/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(() => {});
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
