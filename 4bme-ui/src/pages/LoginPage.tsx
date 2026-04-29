import { useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { ShieldCheck, LayoutGrid, Wrench, Users, Activity } from "lucide-react";

import { auth } from "../firebase/firebase";
import { useAuth } from "../auth/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const { user } = useAuth();
  const location = useLocation() as any;
  const from = location?.state?.from?.pathname || "/";

  const [email, setEmail] = useState("supervisor@hospital.org");
  const [password, setPassword] = useState("Password123!");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (user) return <Navigate to={from} replace />;

  return (
    // <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100">
    <div className="min-h-screen bg-[#d2fff5] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
              <ShieldCheck className="h-4 w-4" />
              Secure access • Audit-friendly • Role-aware
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
              Biomedical Maintenance
              <span className="text-zinc-400"> Control Center</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300">
              Sign in to continue to the platform. Predictive maintenance and assignment intelligence are integrated into your operational workflow.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <FeaturePill
                icon={<LayoutGrid className="h-4 w-4" />}
                title="Unified Dashboard"
                desc="Devices, assignments, and risk."
              />
              <FeaturePill
                icon={<Wrench className="h-4 w-4" />}
                title="Maintenance Ops"
                desc="Track tasks and preventive work."
              />
              <FeaturePill
                icon={<Users className="h-4 w-4" />}
                title="Engineer Visibility"
                desc="Workload and recommendations."
              />
              <FeaturePill
                icon={<Activity className="h-4 w-4" />}
                title="Predictive Layer"
                desc="Risk-based warnings."
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-white/10 bg-white/5 text-zinc-100 shadow-2xl shadow-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl">Sign in</CardTitle>
                <CardDescription className="text-zinc-300">
                  Use your account credentials to access the system.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form
                  className="grid gap-4"
                  onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    setError(null);
                    setInfo(null);

                    if (!isValidEmail(email)) {
                      setError("Please enter a valid email address.");
                      return;
                    }

                    if (!password.trim()) {
                      setError("Password is required.");
                      return;
                    }

                    setLoading(true);

                    try {
                      await setPersistence(
                        auth,
                        rememberMe ? browserLocalPersistence : browserSessionPersistence
                      );

                      await signInWithEmailAndPassword(auth, email, password);
                    } catch (err: any) {
                      setError(err?.message || "Sign in failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-zinc-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/10 bg-black/20 text-zinc-100 placeholder:text-zinc-500"
                      placeholder="name@hospital.org"
                      autoComplete="email"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-zinc-200">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/10 bg-black/20 text-zinc-100 placeholder:text-zinc-500"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      className="text-sm text-zinc-200 underline"
                      onClick={async () => {
                        setError(null);
                        setInfo(null);

                        if (!isValidEmail(email)) {
                          setError("Enter a valid email first to reset password.");
                          return;
                        }

                        try {
                          setResetLoading(true);
                          await sendPasswordResetEmail(auth, email);
                          setInfo("Password reset email sent.");
                        } catch (err: any) {
                          setError(err?.message || "Failed to send password reset email.");
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                    >
                      {resetLoading ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  {info && (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                      {info}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Signing in…" : "Continue"}
                  </Button>

                  <div className="text-center text-sm text-zinc-300">
                    Don’t have an account?{" "}
                    <Link to="/signup" className="underline text-zinc-100">
                      Create one
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/30">
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-1 text-xs text-zinc-300">{desc}</div>
    </div>
  );
}