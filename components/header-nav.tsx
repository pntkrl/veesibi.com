"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToAuthChanges, signOutUser, AuthUser } from "@/lib/auth";

export default function HeaderNav() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-[var(--background)]/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 font-mono text-xs font-bold text-white dark:bg-white dark:text-black">
              V
            </span>
            <span className="font-mono tracking-wider">VEESIBI</span>
            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-600 dark:text-neutral-400 border border-hairline">
              veesibi.com
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <Link href="/dashboard" className="transition hover:text-neutral-900 dark:hover:text-white font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
              Dashboard
            </Link>
            <Link href="/" className="transition hover:text-neutral-900 dark:hover:text-white">
              Instant Audit
            </Link>
            <Link href="/llms-txt/validator" className="transition hover:text-neutral-900 dark:hover:text-white">
              llms.txt Validator
            </Link>
            <Link href="/compare/stripe.com-vs-paypal.com" className="transition hover:text-neutral-900 dark:hover:text-white">
              Versus Benchmarks
            </Link>
            <Link href="/#pricing" className="transition hover:text-neutral-900 dark:hover:text-white">
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-neutral-500 font-medium truncate max-w-[140px]" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-full border border-hairline bg-[var(--background-soft)] font-semibold text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition px-2 py-1"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-hairline bg-[var(--background-soft)] px-3.5 py-1.5 font-semibold text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
              >
                Sign Up
              </Link>
            </>
          )}
          <Link
            href="/#audit-search"
            className="inline-flex h-9 items-center justify-center rounded-full bg-neutral-900 px-4 font-semibold text-white shadow transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Run Instant Audit
          </Link>
        </div>
      </div>
    </header>
  );
}
