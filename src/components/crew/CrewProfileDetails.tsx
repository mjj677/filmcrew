import { GlobeIcon, FilmSlateIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShowreelPlayer } from "@/components/profile/ShowreelPlayer";
import type { Profile } from "@/types/models";

type CrewProfileDetailsProps = {
  profile: Profile;
};

export function CrewProfileDetails({ profile }: CrewProfileDetailsProps) {
  const skills = profile.skills ?? [];
  const hasBio = !!profile.bio;
  const hasSkills = skills.length > 0;
  const hasShowreel = !!profile.showreel_url;
  const hasLinks = !!profile.imdb_url || !!profile.website_url;

  if (!hasBio && !hasSkills && !hasShowreel && !hasLinks) return null;

  return (
    <div className="space-y-6">
      {/* Bio */}
      {hasBio && (
        <>
          <Separator />
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              About
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {profile.bio}
            </p>
          </section>
        </>
      )}

      {/* Links */}
      {hasLinks && (
        <>
          <Separator />
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Links
            </h2>
            <div className="flex flex-col gap-2">
              {profile.imdb_url && (
                <a
                  href={profile.imdb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
                >
                  <FilmSlateIcon size={16} className="shrink-0" />
                  IMDb Profile
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
                >
                  <GlobeIcon size={16} className="shrink-0" />
                  {profile.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </section>
        </>
      )}

      {/* Skills */}
      {hasSkills && (
        <>
          <Separator />
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Showreel */}
      {hasShowreel && (
        <>
          <Separator />
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Showreel
            </h2>
            <ShowreelPlayer url={profile.showreel_url} />
          </section>
        </>
      )}
    </div>
  );
}