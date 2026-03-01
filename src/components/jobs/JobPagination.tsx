import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type JobPaginationProps = {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
};

export function JobPagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: JobPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pb-2 pt-6">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        className="w-24 gap-1"
      >
        <CaretLeftIcon size={14} />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="w-24 gap-1"
      >
        Next
        <CaretRightIcon size={14} />
      </Button>
    </div>
  );
}