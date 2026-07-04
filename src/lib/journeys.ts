export type StageStatus = "complete" | "current" | "upcoming";

export type Task = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  kind?: "questionnaire" | "upload" | "read" | "book" | "watch";
};

export type Resource = {
  id: string;
  title: string;
  type: "PDF" | "Video" | "Website" | "Leaflet" | "Support";
  description: string;
  url?: string;
};

export type FAQ = { q: string; a: string };

export type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  mode: "In person" | "Virtual" | "Phone";
  preparation?: string[];
  bring?: string[];
};

export type Stage = {
  id: string;
  name: string;
  status: StageStatus;
  estimatedDuration?: string;
  description: string;
  providerDoing?: string;
  patientDoing?: string;
  nextStep?: string;
  tasks?: Task[];
  resources?: Resource[];
  faqs?: FAQ[];
};

export type Message = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "warning";
  date: string;
};

export type TimelineEvent = {
  id: string;
  label: string;
  date: string;
};

export type Journey = {
  id: string;
  title: string;
  condition: string;
  provider: string;
  accent: "sage" | "clay" | "mist" | "sand";
  currentStageIndex: number;
  statusLine: string;
  nextLine: string;
  waitEstimate?: string;
  stages: Stage[];
  messages: Message[];
  appointments: Appointment[];
  timeline: TimelineEvent[];
};

const adhd: Journey = {
  id: "adhd",
  title: "ADHD Assessment",
  condition: "Adult ADHD pathway",
  provider: "Meadowbrook Health",
  accent: "sage",
  currentStageIndex: 2,
  statusLine: "Waiting for clinical assessment",
  nextLine: "Your clinician will review your questionnaires.",
  waitEstimate: "4–6 weeks",
  messages: [
    {
      id: "m1",
      title: "Longer waiting times this month",
      body: "We're currently seeing a higher demand for assessments. Thank you for your patience — we'll write to you as soon as a slot opens.",
      tone: "info",
      date: "12 Mar",
    },
  ],
  appointments: [
    {
      id: "a1",
      title: "Clinical assessment",
      date: "Tue 22 Apr",
      time: "10:30",
      location: "Meadowbrook Clinic, Room 4",
      mode: "In person",
      preparation: [
        "Bring a list of medications you take",
        "Think about examples from school and work",
        "Allow 90 minutes for the appointment",
      ],
      bring: ["Photo ID", "Referral letter"],
    },
  ],
  timeline: [
    { id: "t1", label: "Referral received", date: "8 Jan" },
    { id: "t2", label: "Referral accepted", date: "14 Jan" },
    { id: "t3", label: "Questionnaires sent", date: "2 Feb" },
    { id: "t4", label: "AQ10 completed", date: "9 Feb" },
  ],
  stages: [
    {
      id: "s1",
      name: "Referral received",
      status: "complete",
      description: "Your GP sent your referral to our team.",
    },
    {
      id: "s2",
      name: "Referral accepted",
      status: "complete",
      description: "Our clinical team reviewed and accepted your referral.",
    },
    {
      id: "s3",
      name: "Questionnaires",
      status: "current",
      estimatedDuration: "2–3 weeks",
      description: "Complete a few short questionnaires so our team can prepare for your assessment.",
      providerDoing: "We're preparing your assessment file.",
      patientDoing: "Please complete the questionnaires below.",
      nextStep: "Once complete, we'll book your assessment.",
      tasks: [
        { id: "tk1", title: "Complete AQ10 questionnaire", done: true, kind: "questionnaire" },
        { id: "tk2", title: "Complete ASRS questionnaire", done: false, kind: "questionnaire" },
        { id: "tk3", title: "Upload photo ID", done: false, kind: "upload" },
        { id: "tk4", title: "Read the assessment guide", done: false, kind: "read" },
      ],
      resources: [
        { id: "r1", title: "What to expect at your assessment", type: "PDF", description: "A short guide walking you through the assessment." },
        { id: "r2", title: "Preparing for your ADHD assessment", type: "Video", description: "5 minute video from Dr. Amelia Rowe." },
        { id: "r3", title: "ADHD UK", type: "Support", description: "Independent charity offering peer support." },
      ],
      faqs: [
        { q: "How long will I wait for my assessment?", a: "Most people are seen within 4–6 weeks of completing their questionnaires." },
        { q: "Can I rearrange my appointment?", a: "Yes — you'll be able to reschedule from your appointment card once one is booked." },
        { q: "Can I bring someone with me?", a: "Absolutely. A friend, partner or family member is welcome." },
      ],
    },
    { id: "s4", name: "Assessment booked", status: "upcoming", description: "We'll offer you an assessment slot by letter and message." },
    { id: "s5", name: "Assessment complete", status: "upcoming", description: "You'll meet with a specialist clinician for around 90 minutes." },
    { id: "s6", name: "MDT review", status: "upcoming", description: "Our multi-disciplinary team reviews your assessment." },
    { id: "s7", name: "Diagnosis", status: "upcoming", description: "You'll receive a written outcome and next-step recommendations." },
    { id: "s8", name: "Medication titration", status: "upcoming", description: "If appropriate, we'll guide you through finding the right medication." },
    { id: "s9", name: "Annual review", status: "upcoming", description: "A yearly check-in to keep your care on track." },
  ],
};

const crohns: Journey = {
  id: "crohns",
  title: "Crohn's Disease",
  condition: "Ongoing IBD care",
  provider: "St. Alder Gastroenterology",
  accent: "clay",
  currentStageIndex: 3,
  statusLine: "Medication review due",
  nextLine: "Please book a phone review with your IBD nurse.",
  messages: [],
  appointments: [
    {
      id: "a1",
      title: "IBD nurse phone review",
      date: "Thu 3 Apr",
      time: "14:15",
      location: "Phone call",
      mode: "Phone",
      preparation: ["Have your medication list ready", "Note any recent symptoms"],
    },
  ],
  timeline: [
    { id: "t1", label: "Diagnosis confirmed", date: "May 2023" },
    { id: "t2", label: "Started biologic", date: "Aug 2023" },
    { id: "t3", label: "6 month review", date: "Feb 2024" },
  ],
  stages: [
    { id: "s1", name: "Diagnosis", status: "complete", description: "Confirmed via colonoscopy and imaging." },
    { id: "s2", name: "Treatment plan", status: "complete", description: "Agreed with your consultant." },
    { id: "s3", name: "Ongoing monitoring", status: "complete", description: "Regular blood tests and check-ins." },
    {
      id: "s4",
      name: "Medication review",
      status: "current",
      estimatedDuration: "Due now",
      description: "Time for a scheduled review of how your medication is working.",
      patientDoing: "Book a review call with your IBD nurse.",
      tasks: [
        { id: "tk1", title: "Book IBD nurse review", done: false, kind: "book" },
        { id: "tk2", title: "Complete symptom diary (last 4 weeks)", done: false, kind: "questionnaire" },
      ],
      resources: [
        { id: "r1", title: "Living well with Crohn's", type: "Leaflet", description: "Practical tips for daily life." },
      ],
      faqs: [
        { q: "How often do I need reviews?", a: "Typically every 6 months, or sooner if symptoms change." },
      ],
    },
    { id: "s5", name: "Annual specialist review", status: "upcoming", description: "In-person review with your consultant." },
  ],
};

const orthopaedics: Journey = {
  id: "orthopaedics",
  title: "Orthopaedics",
  condition: "Right hip investigation",
  provider: "Meadowbrook Health",
  accent: "mist",
  currentStageIndex: 2,
  statusLine: "MRI booked",
  nextLine: "Attend your MRI scan on 18 April.",
  messages: [],
  appointments: [
    {
      id: "a1",
      title: "MRI scan — right hip",
      date: "Fri 18 Apr",
      time: "09:00",
      location: "Radiology, Level 2",
      mode: "In person",
      preparation: [
        "Wear clothing without metal fastenings",
        "Arrive 15 minutes early",
        "Parking is available on site (£3 flat rate)",
      ],
      bring: ["Appointment letter", "Photo ID"],
    },
  ],
  timeline: [
    { id: "t1", label: "GP referral", date: "20 Feb" },
    { id: "t2", label: "First consultation", date: "10 Mar" },
    { id: "t3", label: "MRI booked", date: "15 Mar" },
  ],
  stages: [
    { id: "s1", name: "Referral", status: "complete", description: "Received from your GP." },
    { id: "s2", name: "First consultation", status: "complete", description: "Assessment with orthopaedic specialist." },
    {
      id: "s3",
      name: "Imaging",
      status: "current",
      description: "MRI scan to understand the cause of your symptoms.",
      nextStep: "Results will be shared within 2 weeks of your scan.",
      tasks: [
        { id: "tk1", title: "Attend MRI scan", done: false, kind: "book" },
        { id: "tk2", title: "Read MRI preparation guide", done: true, kind: "read" },
      ],
      resources: [
        { id: "r1", title: "What happens during an MRI", type: "Video", description: "A short walkthrough of the scan." },
      ],
      faqs: [
        { q: "Is an MRI safe?", a: "Yes — MRI uses magnetic fields, not radiation." },
        { q: "How long does it take?", a: "Usually 20–40 minutes." },
      ],
    },
    { id: "s4", name: "Results", status: "upcoming", description: "Your consultant reviews your scan." },
    { id: "s5", name: "Treatment plan", status: "upcoming", description: "Options discussed with you." },
  ],
};

export const journeys: Journey[] = [adhd, crohns, orthopaedics];

export function getJourney(id: string): Journey | undefined {
  return journeys.find((j) => j.id === id);
}

export function journeyProgress(j: Journey): number {
  const total = j.stages.length;
  const complete = j.stages.filter((s) => s.status === "complete").length;
  const current = j.stages.filter((s) => s.status === "current").length;
  return Math.round(((complete + current * 0.5) / total) * 100);
}

export function allOpenTasks(): { journey: Journey; stage: Stage; task: Task }[] {
  const out: { journey: Journey; stage: Stage; task: Task }[] = [];
  for (const j of journeys) {
    for (const s of j.stages) {
      for (const t of s.tasks ?? []) {
        if (!t.done) out.push({ journey: j, stage: s, task: t });
      }
    }
  }
  return out;
}
