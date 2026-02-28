import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  user: SupabaseUser | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  signInWithOTP: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
  });
  const [isNewSignIn, setIsNewSignIn] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });

      if (event === "SIGNED_IN") {
        setIsNewSignIn(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Separate effect: check setup status after a new sign-in
  useEffect(() => {
    if (!isNewSignIn || !state.user) return;
    setIsNewSignIn(false);

    supabase
      .from("profiles")
      .select("has_completed_setup")
      .eq("id", state.user.id)
      .single()
      .then(({ data }) => {
        if (!data?.has_completed_setup) {
          navigate("/profile?setup=1", { replace: true });
        }
      });
  }, [isNewSignIn, state.user, navigate]);

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