export const workloadData = [
  { name: "Samira", tasks: 12 },
  { name: "Jonas", tasks: 9 },
  { name: "Amina", tasks: 14 },
  { name: "Wei", tasks: 7 },
  { name: "Noah", tasks: 10 },
  { name: "Elena", tasks: 6 },
];

export const focusItems = [
  {
    title: "Ventilator VNT-44 – performance verification",
    subtitle: "ICU • Room 12 • requires calibration",
    badge: "Critical" as const,
  },
  {
    title: "MRI coil replacement approval",
    subtitle: "Radiology • pending supervisor review",
    badge: "Review" as const,
  },
  {
    title: "Infusion pumps – quarterly PM batch",
    subtitle: "Ward B • 8 devices • due this week",
    badge: "Due" as const,
  },
];

export const upcoming = [
  {
    id: "t1",
    device: "Ventilator VNT-44",
    dept: "ICU",
    location: "Room 12",
    engineer: "Samira El-Farouk",
    due: "Today 15:00",
    status: "In progress" as const,
  },
  {
    id: "t2",
    device: "Infusion Pump IP-210",
    dept: "Ward B",
    location: "Nurse Station",
    engineer: "Jonas Richter",
    due: "Tomorrow 10:30",
    status: "Scheduled" as const,
  },
  {
    id: "t3",
    device: "Defibrillator DF-9",
    dept: "ER",
    location: "Bay 3",
    engineer: "Amina Khalid",
    due: "Tue 09:00",
    status: "Scheduled" as const,
  },
  {
    id: "t4",
    device: "CT Scanner CT-88",
    dept: "Radiology",
    location: "CT Suite",
    engineer: "Wei Zhang",
    due: "Wed 13:00",
    status: "Scheduled" as const,
  },
  {
    id: "t5",
    device: "Sterilizer ST-3",
    dept: "CSSD",
    location: "Line 2",
    engineer: "Noah Fischer",
    due: "Thu 08:30",
    status: "Scheduled" as const,
  },
  {
    id: "t6",
    device: "Patient Monitor PM-22",
    dept: "ICU",
    location: "Room 9",
    engineer: "Elena Petrova",
    due: "Fri 11:00",
    status: "Scheduled" as const,
  },
];
