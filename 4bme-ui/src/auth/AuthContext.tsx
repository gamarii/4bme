// import { createContext, useContext, useEffect, useMemo, useState } from "react";

// export type User = {
//   id: string;
//   name: string;
//   email: string;
//   role: "Supervisor" | "Biomedical Engineer";
// };

//  type AuthContextValue = {
//   user: User | null;
//   signIn: (email: string, password: string) => Promise<void>;
//   signOut: () => void;
// };

// const AuthContext = createContext<AuthContextValue | null>(null);

// const AUTH_STORAGE_KEY = "bmms.auth.user";

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const raw = localStorage.getItem(AUTH_STORAGE_KEY);
//     if (raw) setUser(JSON.parse(raw));
//   }, []);

//   const value = useMemo<AuthContextValue>(
//     () => ({
//       user,
//       signIn: async (email, password) => {
//         await new Promise((r) => setTimeout(r, 400));

//         const ok =
//           password === "Password123!" &&
//           ["supervisor@hospital.org", "engineer@hospital.org"].includes(
//             email.toLowerCase()
//           );

//         if (!ok) throw new Error("Invalid credentials");

//         const next: User =
//           email === "engineer@hospital.org"
//             ? {
//                 id: "u1",
//                 name: "Samira El-Farouk",
//                 email,
//                 role: "Biomedical Engineer",
//               }
//             : {
//                 id: "u2",
//                 name: "Dr. Luca Meyer",
//                 email,
//                 role: "Supervisor",
//               };

//         setUser(next);
//         localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
//       },
//       signOut: () => {
//         setUser(null);
//         localStorage.removeItem(AUTH_STORAGE_KEY);
//       },
//     }),
//     [user]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
//   return ctx;
// }

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import type { User as FbUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  role: "Supervisor" | "Biomedical Engineer";
};

type AuthContextValue = {
  user: UserProfile | null;
  firebaseUser: FbUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);

      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as { name: string; role: UserProfile["role"] };
          setUser({
            uid: u.uid,
            email: u.email || "",
            name: data.name,
            role: data.role,
          });
        } else {
          // If profile doc doesn't exist yet, still allow login
          setUser({
            uid: u.uid,
            email: u.email || "",
            name: u.email?.split("@")[0] ?? "User",
            role: "Biomedical Engineer",
          });
        }
      } catch {
        // If Firestore read fails, still allow login with minimal profile
        setUser({
          uid: u.uid,
          email: u.email || "",
          name: u.email?.split("@")[0] ?? "User",
          role: "Biomedical Engineer",
        });
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      loading,
      signOut: async () => {
        await fbSignOut(auth);
      },
    }),
    [user, firebaseUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
