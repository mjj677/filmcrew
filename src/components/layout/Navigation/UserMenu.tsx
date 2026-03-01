import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserCompanies } from "@/hooks/useCompanies";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CaretDownIcon,
  UserIcon,
  PlusIcon,
  SignOutIcon,
  BriefcaseIcon,
} from "@phosphor-icons/react";

export function UserMenu() {
  const { session, signOut, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { companies } = useUserCompanies();

  if (isAuthLoading || (session && isProfileLoading)) return null;

  if (!session) {
    return (
      <Button asChild variant="default" size="sm" className="ml-1">
        <Link to="/auth">Sign in</Link>
      </Button>
    );
  }

  const initials =
    profile?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative ml-1 flex cursor-pointer items-center outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_image_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <CaretDownIcon
            size={10}
            weight="bold"
            className="absolute -bottom-0.5 right-0 rounded-full bg-background text-muted-foreground"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* ── Personal account ─────────────────────────── */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile?.display_name}</p>
          <p className="text-xs text-muted-foreground">@{profile?.username}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/applications">
            <BriefcaseIcon className="mr-2 h-4 w-4" />
            My applications
          </Link>
        </DropdownMenuItem>

        {/* ── Companies ────────────────────────────────── */}
        {companies.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Your companies</DropdownMenuLabel>

            {companies.map((c) => (
              <DropdownMenuItem key={c.id} asChild className="cursor-pointer">
                <Link
                  to={`/companies/${c.slug}/dashboard`}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6 rounded">
                    <AvatarImage src={c.logo_url ?? undefined} />
                    <AvatarFallback className="rounded text-[10px]">
                      {c.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{c.name}</p>
                  </div>
                  {c.role === "owner" && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      Owner
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/companies/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create company
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <SignOutIcon className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}