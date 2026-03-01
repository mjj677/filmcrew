import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeftIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { CreateProductionForm } from "@/components/company/CreateProductionForm";

function CreateProduction() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCompanyDetail(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
        <Separator />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-semibold">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This company doesn't exist or you don't have access.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/home">Go home</Link>
        </Button>
      </div>
    );
  }

  // Only admins+ can create productions
  if (data.role !== "owner" && data.role !== "admin") {
    return (
      <div className="py-20 text-center">
        <WarningIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Insufficient permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only company admins and owners can create productions.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/companies/${slug}/dashboard`}>Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const { company } = data;

  // Check if at tier limit (UX hint — server enforces regardless)
  const activeCount = data.productions.filter(
    (p) => !["wrapped", "cancelled"].includes(p.status)
  ).length;
  const atLimit = activeCount >= company.max_active_productions;

  return (
    <>
      <Helmet>
        <title>New Production — {company.name} | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            to={`/companies/${slug}/dashboard`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {company.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            New production
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a production under {company.name}. You can post job listings
            once it's created.
          </p>
        </div>

        {atLimit ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
            <WarningIcon className="mx-auto h-8 w-8 text-destructive" />
            <h2 className="mt-3 font-semibold">Production limit reached</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {company.tier} tier allows {company.max_active_productions}{" "}
              active production{company.max_active_productions !== 1 && "s"}.
              You currently have {activeCount}. Upgrade your plan or wrap an
              existing production to create a new one.
            </p>
          </div>
        ) : (
          <CreateProductionForm company={company} />
        )}
      </div>
    </>
  );
}

export default CreateProduction;