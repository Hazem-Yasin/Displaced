/**
 * Which live series speak to which part of the dataset.
 * Honesty rule: BLS CES series are INDUSTRY employment (not job-title employment),
 * and Indeed sectors are broad posting categories. The UI labels them that way.
 */

export interface BlsSeriesRef {
  id: string;
  label: string;
}

export const FIELD_BLS: Record<string, BlsSeriesRef[]> = {
  tech: [
    { id: "CES6054150001", label: "Computer systems design & related services" },
    { id: "CES5000000001", label: "Information (publishing, software, telecom, data)" },
  ],
  healthcare: [{ id: "CES6562000001", label: "Health care & social assistance" }],
  law: [{ id: "CES6054110001", label: "Legal services" }],
  finance: [
    { id: "CES6054120001", label: "Accounting, tax prep, bookkeeping & payroll services" },
    { id: "CES5552000001", label: "Finance & insurance" },
  ],
  creative: [{ id: "CES7071000001", label: "Arts, entertainment & recreation (broad proxy)" }],
  admin: [
    { id: "CES6056142001", label: "Telephone call centers" },
    { id: "CES6056140001", label: "Business support services" },
  ],
  education: [{ id: "CES6561000001", label: "Private educational services" }],
  trades: [{ id: "CES2000000001", label: "Construction" }],
  logistics: [
    { id: "CES4348400001", label: "Truck transportation" },
    { id: "CES4349300001", label: "Warehousing & storage" },
  ],
  // Military: BLS CES does not cover active-duty military. Intentionally empty.
  military: [],
};

export const ALL_BLS_IDS = [...new Set(Object.values(FIELD_BLS).flatMap((s) => s.map((x) => x.id)))];

/** job id -> Indeed Hiring Lab sector display name. Jobs without a good match are omitted. */
export const JOB_SECTOR: Record<string, string> = {
  "software-dev": "Software Development",
  "web-dev": "Software Development",
  "qa-tester": "Software Development",
  "data-analyst": "Data & Analytics",
  devops: "IT Infrastructure, Operations & Support",
  "help-desk": "IT Infrastructure, Operations & Support",
  "cyber-analyst": "IT Infrastructure, Operations & Support",
  nurse: "Nursing",
  physician: "Physicians & Surgeons",
  pt: "Therapy",
  paralegal: "Legal",
  lawyer: "Legal",
  "doc-reviewer": "Legal",
  bookkeeper: "Accounting",
  accountant: "Accounting",
  "fin-analyst": "Banking & Finance",
  "fin-advisor": "Banking & Finance",
  underwriter: "Insurance",
  copywriter: "Marketing",
  journalist: "Media & Communications",
  "cs-rep": "Customer Service",
  "data-entry": "Administrative Assistance",
  receptionist: "Administrative Assistance",
  "exec-assistant": "Administrative Assistance",
  teacher: "Education & Instruction",
  tutor: "Education & Instruction",
  professor: "Education & Instruction",
  "instr-designer": "Education & Instruction",
  electrician: "Installation & Maintenance",
  plumber: "Installation & Maintenance",
  hvac: "Installation & Maintenance",
  carpenter: "Construction",
  welder: "Production & Manufacturing",
  "truck-driver": "Driving",
  delivery: "Driving",
  warehouse: "Loading & Stocking",
  dispatcher: "Logistic Support",
};
