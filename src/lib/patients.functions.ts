import { createServerFn } from "@tanstack/react-start";

export type PatientRow = {
  id: string;
  first_name: string;
  provider_ref: string;
  provider_id: string;
  access_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EnrolmentRow = {
  id: string;
  pathway_key: string;
  current_stage_id: string;
  next_action: string | null;
};

export type PatientWithEnrolments = {
  patient: PatientRow;
  enrolments: EnrolmentRow[];
};

// Public lookup: the access code is the secret. Uses admin client to bypass
// RLS in a controlled way (single-row lookup by exact code), then fetches
// every pathway the patient is enrolled in so the page can show them all.
export const getPatientByCode = createServerFn({ method: "GET" })
  .inputValidator((data: { code: string }) => {
    if (!data || typeof data.code !== "string" || data.code.length < 4 || data.code.length > 128) {
      throw new Error("Invalid code");
    }
    return { code: data.code };
  })
  .handler(async ({ data }): Promise<PatientWithEnrolments | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .select("id, first_name, provider_ref, provider_id, access_code, created_by, created_at, updated_at")
      .eq("access_code", data.code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!patient) return null;

    const { data: enrolments, error: enrolmentsError } = await supabaseAdmin
      .from("patient_pathway_enrolments")
      .select("id, pathway_key, current_stage_id, next_action")
      .eq("patient_id", patient.id);
    if (enrolmentsError) throw new Error(enrolmentsError.message);

    return { patient: patient as PatientRow, enrolments: (enrolments as EnrolmentRow[] | null) ?? [] };
  });
