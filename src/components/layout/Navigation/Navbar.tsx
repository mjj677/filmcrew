import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NavLinks } from "@/components/layout/Navigation/NavLinks";
import { UserMenu } from "@/components/layout/Navigation/UserMenu";

export function Navbar() {
  const { session, isLoading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/home" className="text-lg font-semibold tracking-tight">
          FilmCrew
        </Link>
        <div className={`flex items-center gap-1 ${isLoading ? "invisible" : ""}`}>
          <NavLinks session={session} />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}