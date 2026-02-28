import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/models";

type AuthState = {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  isLoading: boolean;
};

type AuthContext = AuthState & {
  signInWithOTP: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
  });

useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setState((prev) => ({
      ...prev,
      session,
      user: session?.user ?? null,
      isLoading: false,
    }));
  });

  return () => subscription.unsubscribe();
}, []);

// Fetch profile whenever user changes
useEffect(() => {
  if (!state.user) {
    setState((prev) => ({ ...prev, profile: null }));
    return;
  }

  fetchProfile(state.user.id).then((profile) => {
    setState((prev) => ({ ...prev, profile }));
  });
}, [state.user?.id]);

  async function signInWithOTP(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message ?? null };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext
      value={{
        ...state,
        signInWithOTP,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}