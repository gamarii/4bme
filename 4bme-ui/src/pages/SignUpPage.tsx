import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState<"Supervisor" | "Biomedical Engineer">("Biomedical Engineer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#d2fff5] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
        <Card className="w-full border-white/10 bg-white/5 text-zinc-100 shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Create account</CardTitle>
            <CardDescription className="text-zinc-300">
              Sign up with email/password. Profile is stored in Firestore.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                setError(null);
                setLoading(true);

                try {
                  const cred = await createUserWithEmailAndPassword(auth, email, password);

                  // Store user profile in Firestore
                  await setDoc(doc(db, "users", cred.user.uid), {
                    name,
                    role,
                    createdAt: serverTimestamp(),
                  });

                  nav("/");
                } catch (err: any) {
                  setError(err?.message ?? "Sign up failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="grid gap-2">
                <Label className="text-zinc-200" htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="border-white/10 bg-black/20 text-zinc-100"
                  placeholder="e.g., Samira El-Farouk"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-zinc-200" htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-100"
                >
                  <option value="Biomedical Engineer">Biomedical Engineer</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label className="text-zinc-200" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="border-white/10 bg-black/20 text-zinc-100"
                  placeholder="name@hospital.org"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-zinc-200" htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="border-white/10 bg-black/20 text-zinc-100"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating…" : "Create account"}
              </Button>

              <div className="text-center text-sm text-zinc-300">
                Already have an account?{" "}
                <Link className="text-zinc-100 underline" to="/login">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
