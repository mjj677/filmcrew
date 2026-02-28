import { UsersIcon } from "@phosphor-icons/react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { useConnections } from "@/hooks/useConnections";

function ConnectionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <UsersIcon size={40} className="mb-3 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">
        No connections yet
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Browse the crew directory and connect with people you'd like to work
        with.
      </p>
    </div>
  );
}

export function ConnectionsList() {
  const {
    accepted,
    pendingIncoming,
    pendingSent,
    isLoading,
  } = useConnections();

  if (isLoading) return <ConnectionsSkeleton />;

  const isEmpty =
    accepted.length === 0 &&
    pendingIncoming.length === 0 &&
    pendingSent.length === 0;

  if (isEmpty) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Incoming requests */}
      {pendingIncoming.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground">
            Incoming requests ({pendingIncoming.length})
          </h2>
          <div className="divide-y">
            {pendingIncoming.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connectionId={conn.id}
                profile={conn.profile}
                variant="incoming"
              />
            ))}
          </div>
        </section>
      )}

      {/* Accepted connections */}
      {accepted.length > 0 && (
        <section>
          {pendingIncoming.length > 0 && <Separator className="mb-6" />}
          <h2 className="text-sm font-medium text-muted-foreground">
            Connections ({accepted.length})
          </h2>
          <div className="divide-y">
            {accepted.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connectionId={conn.id}
                profile={conn.profile}
                variant="accepted"
              />
            ))}
          </div>
        </section>
      )}

      {/* Sent pending */}
      {pendingSent.length > 0 && (
        <section>
          {(pendingIncoming.length > 0 || accepted.length > 0) && (
            <Separator className="mb-6" />
          )}
          <h2 className="text-sm font-medium text-muted-foreground">
            Sent requests ({pendingSent.length})
          </h2>
          <div className="divide-y">
            {pendingSent.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connectionId={conn.id}
                profile={conn.profile}
                variant="sent"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}