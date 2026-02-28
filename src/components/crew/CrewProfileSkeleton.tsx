import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function CrewProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
        <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
        <div className="mt-4 space-y-2 sm:mt-0">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-4 pt-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <Separator />

      {/* Skills */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-14" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-18 rounded-full" />
        </div>
      </div>

      <Separator />

      {/* Showreel */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>
    </div>
  );
}