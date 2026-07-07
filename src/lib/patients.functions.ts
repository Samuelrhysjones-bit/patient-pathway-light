import { createServerFn } from "@tanstack/react-start";

export type PatientRow = {
  id: string;
  first_name: string;
  provider_ref: string;
  provider_id: string;
  pathway: string;
  current_stage_id: string;
  next_action: string | null;
  access_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// Public lookup: the access code is the secret. Uses admin client to bypass
// RLS in a controlled way (single-row lookup by exact code).
export const getPatientByCode = createServerFn({ method: "GET" })
  .inputValidator((data: { code: string }) => {
    if (!data || typeof data.code !== "string" || data.code.length < 4 || data.code.length > 128) {
      throw new Error("Invalid code");
    }
    return { code: data.code };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("patients")
      .select("id, first_name, provider_ref, provider_id, pathway, current_stage_id, next_action, access_code, created_by, created_at, updated_at")
      .eq("access_code", data.code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as PatientRow | null) ?? null;
  });
