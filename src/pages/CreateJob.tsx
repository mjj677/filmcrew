import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeftIcon,
  FilmSlateIcon,
  WarningIcon,
  ProhibitIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductionDetail } from "@/hooks/useProductionDetail";
import { CreateJobForm } from "@/components/company/CreateJobForm";

function CreateJob() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useProductionDetail(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <FilmSlateIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Production not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This production doesn't exist or you don't have access.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/home">Go home</Link>
        </Button>
      </div>
    );
  }

  const { production, role } = data;
  const isAdmin = role === "owner" || role === "admin";

  // Permission check
  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <WarningIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Insufficient permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only company admins and owners can post jobs.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/productions/${slug}`}>Back to production</Link>
        </Button>
      </div>
    );
  }

  // Block job creation on wrapped/cancelled productions
  const isInactive = production.status === "wrapped" || production.status === "cancelled";
  if (isInactive) {
    const statusLabel = production.status === "wrapped" ? "wrapped" : "cancelled";
    return (
      <div className="py-20 text-center">
        <ProhibitIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">
          Can't post jobs on a {statusLabel} production
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This production is {statusLabel}. Change the status if you need to
          post new roles.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/productions/${slug}/edit`}>Edit production</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Post a Job — {production.title} | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            to={`/productions/${slug}`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {production.title}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Post a job</h1>
          {!production.is_published && (
            <p className="mt-1 text-sm text-amber-600">
              This production is a draft — the job won't be publicly visible
              until you publish the production.
            </p>
          )}
        </div>

        <CreateJobForm
          productionId={production.id}
          productionSlug={production.slug}
          productionTitle={production.title}
        />
      </div>
    </>
  );
}

export default CreateJob;