export type PathwayKey = "adhd" | "autism";

export const PATHWAY_CATALOGUE: { key: PathwayKey; label: string }[] = [
  { key: "adhd", label: "ADHD Assessment" },
  { key: "autism", label: "Autism Assessment" },
];

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

const autism: Journey = {
  id: "autism",
  title: "Autism Assessment",
  condition: "Adult autism pathway",
  provider: "Meadowbrook Health",
  accent: "mist",
  currentStageIndex: 1,
  statusLine: "On the waiting list for assessment",
  nextLine: "We'll be in touch when it's time to prepare for your assessment.",
  waitEstimate: "3–4 months",
  messages: [],
  appointments: [],
  timeline: [
    { id: "t1", label: "Referral received", date: "8 Jan" },
    { id: "t2", label: "Referral accepted", date: "20 Jan" },
  ],
  stages: [
    {
      id: "s1",
      name: "Referral received",
      status: "complete",
      description: "Your referral has been received and logged.",
    },
    {
      id: "s2",
      name: "Referral accepted",
      status: "current",
      estimatedDuration: "3–4 months",
      description: "You're on the waiting list for an autism assessment.",
      providerDoing: "We're working through our waiting list in order.",
      patientDoing: "No action needed while you wait.",
      nextStep: "We'll contact you when it's time to prepare for your assessment.",
      resources: [
        { id: "r1", title: "What to expect from an autism assessment", type: "PDF", description: "A short guide to the assessment process." },
        { id: "r2", title: "Autism support network", type: "Support", description: "Independent charity offering peer support." },
      ],
      faqs: [
        { q: "How long is the waiting list?", a: "Most people are offered an assessment within 3–4 months, though this can vary." },
        { q: "Will I be kept updated?", a: "Yes — we'll message you if anything changes, and you can check this page any time." },
      ],
    },
    { id: "s3", name: "Pre-assessment preparation", status: "upcoming", description: "We'll ask you to complete some background information before your assessment." },
    { id: "s4", name: "Assessment booked", status: "upcoming", description: "We'll offer you an assessment slot by letter and message." },
    { id: "s5", name: "Assessment completed", status: "upcoming", description: "You'll meet with a specialist clinician for your assessment." },
    { id: "s6", name: "Outcome being prepared", status: "upcoming", description: "Our team is preparing your outcome report." },
    { id: "s7", name: "Next steps", status: "upcoming", description: "You'll receive a written outcome and next-step recommendations." },
  ],
};

export const journeys: Journey[] = [adhd, autism];

export function getJourney(id: PathwayKey | string): Journey | undefined {
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
