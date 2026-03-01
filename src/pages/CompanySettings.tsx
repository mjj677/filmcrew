import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeftIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { EditCompanyForm } from "@/components/company/EditCompanyForm";
import { TeamManagement } from "@/components/company/TeamManagement";

function CompanySettings() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useCompanyDetail(slug);

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

  if (data.role !== "owner" && data.role !== "admin") {
    return (
      <div className="py-20 text-center">
        <WarningIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h2 className="mt-3 text-lg font-semibold">Insufficient permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only company admins and owners can access settings.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={`/companies/${slug}/dashboard`}>Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const { company, role, members } = data;

  return (
    <>
      <Helmet>
        <title>Settings — {company.name} | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            to={`/companies/${slug}/dashboard`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {company.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="cursor-pointer">
            <TabsTrigger value="details" className="cursor-pointer">Details</TabsTrigger>
            <TabsTrigger value="team" className="cursor-pointer">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <EditCompanyForm company={company} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamManagement
              company={company}
              members={members}
              currentUserRole={role!}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default CompanySettings;