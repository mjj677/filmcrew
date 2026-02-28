import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/models";

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch profile:", error.message);
    return null;
  }

  return data;
}

export const profileKeys = {
  all: ["profiles"] as const,
  detail: (id: string) => [...profileKeys.all, id] as const,
};

/**
 * Fetches the current user's profile via TanStack Query.
 * Returns cached data after first load — use `invalidateProfile()`
 * or the query client to trigger a refetch.
 */
export function useProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const query = useQuery({
    queryKey: profileKeys.detail(user?.id ?? ""),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });

  return {
    profile: query.data ?? null,
    isLoading: isAuthLoading || query.isLoading,
    error: query.error,
  };
}

/** Helper to invalidate the current user's profile from anywhere */
export function useInvalidateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return () => {
    if (user?.id) {
      return queryClient.invalidateQueries({ queryKey: profileKeys.detail(user.id) });
    }
    return Promise.resolve();
  };
}