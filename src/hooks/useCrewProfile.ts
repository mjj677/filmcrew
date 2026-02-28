import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/models";

async function fetchProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("has_completed_setup", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(error.message);
  }

  return data;
}

export const crewProfileKeys = {
  all: ["crew-profile"] as const,
  detail: (username: string) =>
    [...crewProfileKeys.all, username] as const,
};

export function useCrewProfile(username: string | undefined) {
  const query = useQuery({
    queryKey: crewProfileKeys.detail(username ?? ""),
    queryFn: () => fetchProfileByUsername(username!),
    enabled: !!username,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isNotFound: !query.isLoading && !query.data,
    error: query.error,
  };
}