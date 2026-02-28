import { Link } from "react-router-dom";
import { UserIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function CrewProfileNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <UserIcon size={48} className="mb-4 text-muted-foreground/50" />
      <h2 className="text-lg font-semibold">Profile not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This crew member doesn't exist or hasn't completed their profile yet.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/crew">Browse crew directory</Link>
      </Button>
    </div>
  );
}