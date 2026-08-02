"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth";
import JsonLd from "@/components/json-ld";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await signUpWithEmail(email, password, orgName);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.requiresVerification) {
      setNeedsVerification(true);
    } else {
      setSubmitted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await signInWithGoogle();
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.url) {
      if (res.url.startsWith('http')) {
        window.location.href = res.url;
      } else {
        router.push(res.url);
      }
    }
  };

  return (
    <div className="py-20 bg-[var(--background)] min-h-[85vh] flex items-center justify-center">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "VEESIBI Home",
              item: "https://veesibi.com",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Sign Up",
              item: "https://veesibi.com/signup",
            },
          ],
        }}
      />
      <div className="mx-auto max-w-md w-full px-4">
        {/* Auth Form Card matching DESIGN.md ex-auth-form-card */}
        <div className="p-8 rounded-2xl border border-hairline bg-[var(--background-soft)] card-vercel-shadow">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold font-mono tracking-wider text-neutral-900 dark:text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-xs font-bold text-white dark:bg-white dark:text-black">
                V
              </span>
              VEESIBI
            </Link>
            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-4">
              Create your VEESIBI Account
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Start monitoring your domain's AI Search visibility & llms.txt compliance.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 font-mono text-xs">
              {errorMessage}
            </div>
          )}

          {needsVerification ? (
            <div className="p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-neutral-900 dark:text-white text-center font-mono text-xs">
              <div className="text-3xl mb-3">✉️</div>
              <h3 className="font-bold text-sm text-cyan-600 dark:text-cyan-400">Check Your Inbox</h3>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300 leading-relaxed">
                We sent a confirmation link to <strong className="text-neutral-900 dark:text-white">{email}</strong>.
              </p>
              <p className="mt-2 text-[11px] text-neutral-500">
                Please click the link in your email to verify your account and access your workspace dashboard.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block w-full py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider hover:opacity-90 transition"
              >
                Go to Login →
              </Link>
            </div>
          ) : submitted ? (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-center font-mono text-xs">
              <div className="text-2xl mb-2">✓</div>
              <div className="font-bold text-sm">Account Created Successfully!</div>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">Redirecting to your workspace dashboard...</p>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isSubmitting}
                className="w-full h-10 mb-4 rounded-xl border border-hairline bg-[var(--background)] font-sans font-medium text-xs text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center gap-2.5 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hairline"></div></div>
                <span className="relative bg-[var(--background-soft)] px-2 text-[10px] uppercase text-neutral-400">or sign up with email</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1.5 font-medium">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-10 rounded-lg border border-hairline bg-[var(--background)] px-3 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1.5 font-medium">Workspace / Company Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full h-10 rounded-lg border border-hairline bg-[var(--background)] px-3 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1.5 font-medium">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 rounded-lg border border-hairline bg-[var(--background)] px-3 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 mt-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account with Email →"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 dark:text-white underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
