import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type ProviderAuth = {
  loading: boolean;
  userEmail: string | null;
  providerId: string | null;
  signOut: () => Promise<void>;
};

// Shared by every /admin route: confirms a session exists and looks up the
// caller's provider_id (RLS relies on this being set — see admin.tsx's
// unassigned-account guard for what happens when it's null).
export function useProviderAuth(): ProviderAuth {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserEmail(data.session.user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("provider_id")
        .eq("id", data.session.user.id)
        .maybeSingle();
      setProviderId(profile?.provider_id ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return { loading, userEmail, providerId, signOut };
}
