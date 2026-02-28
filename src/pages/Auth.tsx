import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { EmailForm } from "@/components/auth/EmailForm";
import { Separator } from "@/components/ui/separator";

function Auth() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;
  if (session) return <Navigate to="/home" replace />;

  return (
    <>
      <Helmet>
        <title>Sign in | FilmCrew</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">FilmCrew</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to connect with film professionals
            </p>
          </div>

          <div className="space-y-4">
            <GoogleButton />
            <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
            </div>
            <EmailForm />
          </div>
        </div>
      </div>
    </>
  );
}
export default Auth;