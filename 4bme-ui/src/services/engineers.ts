import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { Engineer } from "@/types/engineer";

const colRef = collection(db, "engineers");

export async function listEngineers(): Promise<Engineer[]> {
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Engineer, "id">),
  }));
}