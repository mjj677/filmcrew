import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeftIcon, BriefcaseIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useJobDetail } from "@/hooks/useJobs";
import { useAuth } from "@/context/AuthContext";
import { EditJobForm } from "@/components/jobs/EditJobForm";

function EditJob() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: job, isLoading, error } = useJobDetail(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Separator />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-20 text-center">
        <BriefcaseIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Job not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This job listing doesn't exist or has been removed.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
    );
  }

  const isOwnJob = !!user && job.posted_by === user.id;
  const isCompanyAdmin =
    job.companyRole === "owner" || job.companyRole === "admin";
  const canEdit = isOwnJob || isCompanyAdmin;

  if (!canEdit) {
    return (
      <div className="py-20 text-center">
        <WarningIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Insufficient permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the job poster and company admins can edit this listing.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/jobs/${id}`}>Back to listing</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit — {job.title} | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            to={`/jobs/${id}`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {job.title}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Edit job</h1>
        </div>

        <EditJobForm job={job} />
      </div>
    </>
  );
}

export default EditJob;