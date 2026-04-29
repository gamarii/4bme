import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

/** Call this once (dev only) to populate Firestore with fake data. */
export async function seedFirestore() {
  // -------- Devices --------
  const devices = [
    {
      id: "dev_vnt_044",
      name: "Ventilator VNT-44",
      model: "VNT-44",
      department: "ICU",
      location: "Room 12",
      status: "Active",
      criticality: "High",
      manufacturer: "MedAir",
    },
    {
      id: "dev_ip_210",
      name: "Infusion Pump IP-210",
      model: "IP-210",
      department: "Ward B",
      location: "Nurse Station",
      status: "Active",
      criticality: "Medium",
      manufacturer: "FlowCare",
    },
    {
      id: "dev_df_009",
      name: "Defibrillator DF-9",
      model: "DF-9",
      department: "ER",
      location: "Bay 3",
      status: "Active",
      criticality: "High",
      manufacturer: "PulseSafe",
    },
    {
      id: "dev_ct_088",
      name: "CT Scanner CT-88",
      model: "CT-88",
      department: "Radiology",
      location: "CT Suite",
      status: "Active",
      criticality: "High",
      manufacturer: "ImagiTech",
    },
    {
      id: "dev_st_003",
      name: "Sterilizer ST-3",
      model: "ST-3",
      department: "CSSD",
      location: "Line 2",
      status: "Active",
      criticality: "Medium",
      manufacturer: "SterilPro",
    },
  ];

  for (const d of devices) {
    await setDoc(doc(db, "devices", d.id), {
      ...d,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // -------- Work Orders --------
  const workOrders = [
    {
      id: "wo_1001",
      deviceId: "dev_vnt_044",
      priority: "Critical",
      description: "Performance verification + calibration check",
      status: "In progress",
      dueDate: "2026-02-24T15:00:00.000Z",
      assignedEngineerName: "Samira El-Farouk",
      partsBlocked: false,
    },
    {
      id: "wo_1002",
      deviceId: "dev_ip_210",
      priority: "High",
      description: "Quarterly preventive maintenance batch",
      status: "Scheduled",
      dueDate: "2026-02-25T10:30:00.000Z",
      assignedEngineerName: "Jonas Richter",
      partsBlocked: true,
    },
    {
      id: "wo_1003",
      deviceId: "dev_df_009",
      priority: "High",
      description: "Battery health check + electrode pads expiry audit",
      status: "Scheduled",
      dueDate: "2026-02-26T09:00:00.000Z",
      assignedEngineerName: "Amina Khalid",
      partsBlocked: false,
    },
    {
      id: "wo_1004",
      deviceId: "dev_ct_088",
      priority: "Medium",
      description: "Detector calibration + imaging artifact inspection",
      status: "Scheduled",
      dueDate: "2026-02-27T13:00:00.000Z",
      assignedEngineerName: "Wei Zhang",
      partsBlocked: false,
    },
  ];

  for (const w of workOrders) {
    await setDoc(doc(db, "workOrders", w.id), {
      ...w,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // -------- Maintenance Logs --------
  const logs = [
    {
      id: "log_2001",
      workOrderId: "wo_1001",
      deviceId: "dev_vnt_044",
      failureCode: "CAL-DRIFT",
      partsUsed: ["Calibration kit"],
      notes: "Observed minor drift in flow sensor. Recalibrated and verified within spec.",
      createdBy: "engineer@hospital.org",
    },
    {
      id: "log_2002",
      workOrderId: "wo_1002",
      deviceId: "dev_ip_210",
      failureCode: "NA",
      partsUsed: [],
      notes: "PM checklist started. Waiting for filter set delivery.",
      createdBy: "engineer@hospital.org",
    },
  ];

  for (const l of logs) {
    await setDoc(doc(db, "maintenanceLogs", l.id), {
      ...l,
      timestamp: serverTimestamp(),
    });
  }

  // -------- Parts Requests --------
  const parts = [
    {
      id: "pr_3001",
      workOrderId: "wo_1002",
      partName: "IP-210 Filter Set",
      status: "ordered", // requested | ordered | received
      updatedAt: serverTimestamp(),
    },
  ];

    // -------- Engineers --------
  const engineers = [
    {
      id: "eng_1",
      name: "Samira El-Farouk",
      email: "samira@hospital.org",
      role: "Biomedical Engineer",
      skills: ["ventilator", "icu", "calibration", "infusion pump"],
      certifications: ["ICU Devices", "Ventilator Specialist"],
      location: "ICU",
      isActive: true,
    },
    {
      id: "eng_2",
      name: "Jonas Richter",
      email: "jonas@hospital.org",
      role: "Biomedical Engineer",
      skills: ["defibrillator", "emergency", "battery systems"],
      certifications: ["Emergency Devices"],
      location: "ER",
      isActive: true,
    },
    {
      id: "eng_3",
      name: "Amina Khalid",
      email: "amina@hospital.org",
      role: "Biomedical Engineer",
      skills: ["ct scanner", "radiology", "imaging", "calibration"],
      certifications: ["Radiology Systems"],
      location: "Radiology",
      isActive: true,
    },
    {
      id: "eng_4",
      name: "Wei Zhang",
      email: "wei@hospital.org",
      role: "Biomedical Engineer",
      skills: ["sterilizer", "cssd", "maintenance", "preventive"],
      certifications: ["CSSD Equipment"],
      location: "CSSD",
      isActive: true,
    },
    {
      id: "eng_5",
      name: "Noah Fischer",
      email: "noah@hospital.org",
      role: "Biomedical Engineer",
      skills: ["infusion pump", "ward devices", "preventive maintenance"],
      certifications: ["General Biomedical"],
      location: "Ward B",
      isActive: true,
    },
  ];

  for (const e of engineers) {
    await setDoc(doc(db, "engineers", e.id), {
      ...e,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const p of parts) {
    await setDoc(doc(db, "partsRequests", p.id), p);
  }

  alert("✅ Firestore seeded successfully!");
}