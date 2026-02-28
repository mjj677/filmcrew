import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Avatar */}
      <div className="flex justify-center">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>

      <Separator className="my-8" />

      {/* Basic info */}
      <div className="space-y-5">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>

      <Separator className="my-8" />

      {/* Role */}
      <div className="space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-full" />
      </div>

      <Separator className="my-8" />

      {/* Location */}
      <div className="space-y-5">
        <Skeleton className="h-4 w-20" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-9 w-full rounded-full" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}