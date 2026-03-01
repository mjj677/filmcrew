import { Helmet } from "react-helmet-async";
import { CreateCompanyForm } from "@/components/company/CreateCompanyForm";

function CreateCompany() {
  return (
    <>
      <Helmet>
        <title>Create Company | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create a production company
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your company to start posting productions and hiring crew.
          </p>
        </div>

        <CreateCompanyForm />
      </div>
    </>
  );
}

export default CreateCompany;