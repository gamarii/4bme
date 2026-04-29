import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import type { Device } from "@/types/device";

const devicesCol = collection(db, "devices");

export async function createDevice(input: Omit<Device, "id" | "createdAt" | "updatedAt">) {
  const ref = doc(devicesCol);
  const payload = {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return ref.id;
}

export async function updateDevice(id: string, patch: Partial<Device>) {
  const ref = doc(db, "devices", id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function getDevice(id: string): Promise<Device | null> {
  const ref = doc(db, "devices", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Device, "id">) };
}

export async function listDevices(): Promise<Device[]> {
  const q = query(devicesCol, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Device, "id">) }));
}

export async function searchDevices(text: string): Promise<Device[]> {
  // Simple fallback search: filter by department exact match (you can enhance later)
  // Firestore doesn't support full-text search without Algolia/Meilisearch/etc.
  const q = query(devicesCol, where("department", "==", text));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Device, "id">) }));
}