import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useCrewProfile } from "@/hooks/useCrewProfile";
import { useAuth } from "@/context/AuthContext";
import { CrewProfileHeader } from "@/components/crew/CrewProfileHeader";
import { CrewProfileDetails } from "@/components/crew/CrewProfileDetails";
import { CrewProfileSkeleton } from "@/components/crew/CrewProfileSkeleton";
import { CrewProfileNotFound } from "@/components/crew/CrewProfileNotFound";
import { ConnectButton } from "@/components/crew/ConnectButton";
import { MessageButton } from "@/components/crew/MessageButton";

function CrewProfile() {
  const { username } = useParams<{ username: string }>();
  const { profile, isLoading, isNotFound } = useCrewProfile(username);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Crew Profile | FilmCrew</title>
        </Helmet>
        <CrewProfileSkeleton />
      </>
    );
  }

  if (isNotFound || !profile) {
    return (
      <>
        <Helmet>
          <title>Not Found | FilmCrew</title>
        </Helmet>
        <CrewProfileNotFound />
      </>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <>
      <Helmet>
        <title>
          {profile.display_name ?? profile.username} | FilmCrew
        </title>
      </Helmet>

      <div className="mx-auto max-w-2xl">
        {/* Back link + actions */}
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/crew">
              <ArrowLeftIcon size={14} />
              Back to directory
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">Edit profile</Link>
              </Button>
            ) : (
              <>
                    <MessageButton targetUserId={profile.id} />
                    <ConnectButton
                    targetUserId={profile.id}
                    targetName={profile.display_name ?? profile.username}
                    />
              </>
            )}
          </div>
        </div>

        <CrewProfileHeader profile={profile} />
        <div className="mt-6">
          <CrewProfileDetails profile={profile} />
        </div>
      </div>
    </>
  );
}

export default CrewProfile;