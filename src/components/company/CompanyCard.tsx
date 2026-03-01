import { Link } from "react-router-dom";
import {
  MapPinIcon,
  UsersIcon,
  FilmSlateIcon,
  GlobeIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CompanyWithCounts } from "@/hooks/useCompanyDirectory";

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-stone-100 text-stone-600" },
  pro: { label: "Pro", className: "bg-violet-100 text-violet-700" },
  enterprise: { label: "Enterprise", className: "bg-amber-100 text-amber-700" },
};

type CompanyCardProps = {
  company: CompanyWithCounts;
};

export function CompanyCard({ company }: CompanyCardProps) {
  const initials = company.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const location = [company.city, company.country].filter(Boolean).join(", ");
  const tier = TIER_CONFIG[company.tier] ?? TIER_CONFIG.free;

  return (
    <Link
      to={`/companies/${company.slug}`}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src={company.logo_url ?? undefined} alt={company.name} />
          <AvatarFallback className="rounded-lg text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold leading-tight group-hover:underline">
              {company.name}
            </h3>
            {company.is_verified && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
            {company.tier !== "free" && (
              <Badge variant="secondary" className={`text-xs ${tier.className}`}>
                {tier.label}
              </Badge>
            )}
          </div>
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPinIcon className="h-3 w-3 shrink-0" />
              {location}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {company.description}
        </p>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <UsersIcon className="h-3.5 w-3.5" />
            {company.memberCount}{" "}
            {company.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="flex items-center gap-1">
            <FilmSlateIcon className="h-3.5 w-3.5" />
            {company.productionCount}{" "}
            {company.productionCount === 1 ? "production" : "productions"}
          </span>
        </div>
        {company.website_url && (
          <GlobeIcon className="h-3.5 w-3.5 shrink-0" />
        )}
      </div>
    </Link>
  );
}