import { Helmet } from "react-helmet-async";
import { ConnectionsList } from "@/components/connections/ConnectionsList";

function Connections() {
  return (
    <>
      <Helmet>
        <title>Connections | FilmCrew</title>
      </Helmet>

      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your crew connections and requests.
          </p>
        </div>

        <ConnectionsList />
      </div>
    </>
  );
}

export default Connections;