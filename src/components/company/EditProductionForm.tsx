import { useState } from "react";
import {
  SpinnerIcon,
  FilmSlateIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyGbpIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useUpdateProduction,
  useTogglePublish,
  useChangeProductionStatus,
} from "@/hooks/useProductions";
import type { Production, ProductionStatus, ProductionCompany } from "@/types/models";

// ── Constants ─────────────────────────────────────────────

const PRODUCTION_TYPES = [
  { value: "feature_film", label: "Feature Film" },
  { value: "short_film", label: "Short Film" },
  { value: "commercial", label: "Commercial" },
  { value: "music_video", label: "Music Video" },
  { value: "series", label: "Series" },
  { value: "documentary", label: "Documentary" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
] as const;

const BUDGET_RANGES = [
  { value: "micro", label: "Micro (under £10k)" },
  { value: "low", label: "Low (£10k–£100k)" },
  { value: "mid", label: "Mid (£100k–£1M)" },
  { value: "high", label: "High (£1M+)" },
] as const;

const PRODUCTION_STATUSES: { value: ProductionStatus; label: string }[] = [
  { value: "pre_production", label: "Pre-production" },
  { value: "in_production", label: "In production" },
  { value: "post_production", label: "Post-production" },
  { value: "wrapped", label: "Wrapped" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pre_production: "bg-yellow-100 text-yellow-800",
  in_production: "bg-green-100 text-green-800",
  post_production: "bg-blue-100 text-blue-800",
  wrapped: "bg-stone-100 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
};

// ── NONE sentinel for clearable selects ───────────────────

const NONE = "__none__";

// ── Props ─────────────────────────────────────────────────

type Props = {
  production: Production;
  company: Pick<ProductionCompany, "id" | "slug">;
};

// ── Component ─────────────────────────────────────────────

export function EditProductionForm({ production, company }: Props) {
  const updateProduction = useUpdateProduction();
  const togglePublish = useTogglePublish();
  const changeStatus = useChangeProductionStatus();

  // ── Form state ────────────────────────────────────────

  const [title, setTitle] = useState(production.title);
  const [description, setDescription] = useState(production.description ?? "");
  const [productionType, setProductionType] = useState(
    production.production_type ?? NONE
  );
  const [startDate, setStartDate] = useState(production.start_date ?? "");
  const [endDate, setEndDate] = useState(production.end_date ?? "");
  const [location, setLocation] = useState(production.location ?? "");
  const [country, setCountry] = useState(production.country ?? "");
  const [budgetRange, setBudgetRange] = useState(
    production.budget_range ?? NONE
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Status change dialog ─────────────────────────────
  const [pendingStatus, setPendingStatus] = useState<ProductionStatus | null>(
    null
  );

  // ── Dirty tracking ───────────────────────────────────

  const isDirty =
    title !== production.title ||
    description !== (production.description ?? "") ||
    productionType !== (production.production_type ?? NONE) ||
    startDate !== (production.start_date ?? "") ||
    endDate !== (production.end_date ?? "") ||
    location !== (production.location ?? "") ||
    country !== (production.country ?? "") ||
    budgetRange !== (production.budget_range ?? NONE);

  // ── Validation ───────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Production title is required.";
    if (startDate && endDate && endDate < startDate) {
      e.endDate = "End date must be after start date.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ─────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateProduction.mutate({
      productionId: production.id,
      productionSlug: production.slug,
      companySlug: company.slug,
      title: title.trim(),
      description: description.trim() || null,
      production_type:
        productionType === NONE
          ? null
          : (productionType as Production["production_type"]),
      start_date: startDate || null,
      end_date: endDate || null,
      location: location.trim() || null,
      country: country.trim() || null,
      budget_range:
        budgetRange === NONE
          ? null
          : (budgetRange as Production["budget_range"]),
    });
  }

  function handleTogglePublish() {
    togglePublish.mutate({
      productionId: production.id,
      productionSlug: production.slug,
      companySlug: company.slug,
      publish: !production.is_published,
    });
  }

  function handleStatusChange() {
    if (!pendingStatus) return;
    changeStatus.mutate(
      {
        productionId: production.id,
        productionSlug: production.slug,
        companySlug: company.slug,
        status: pendingStatus,
      },
      { onSuccess: () => setPendingStatus(null) }
    );
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Publish & Status controls ─────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Status & Visibility</h2>

        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Visibility</p>
              <Badge
                variant="secondary"
                className={
                  production.is_published
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {production.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {production.is_published
                ? "This production is visible to the public."
                : "Only team members can see this production."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleTogglePublish}
            disabled={togglePublish.isPending}
          >
            {togglePublish.isPending ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : production.is_published ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            {production.is_published ? "Unpublish" : "Publish"}
          </Button>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Production status</p>
              <Badge
                variant="secondary"
                className={STATUS_COLORS[production.status] ?? ""}
              >
                {PRODUCTION_STATUSES.find((s) => s.value === production.status)
                  ?.label ?? production.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Reflects the current stage of this production.
            </p>
          </div>
          <Select
            value={production.status}
            onValueChange={(v) => setPendingStatus(v as ProductionStatus)}
          >
            <SelectTrigger className="w-full sm:w-44 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="cursor-pointer">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      {/* ── Edit form ─────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FilmSlateIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Production Details</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-prod-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-prod-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>URL slug</Label>
            <div className="flex items-center rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
              filmcrew.com/productions/{production.slug}
            </div>
            <p className="text-xs text-muted-foreground">
              Slugs cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-prod-description">Description</Label>
            <Textarea
              id="edit-prod-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
            <p className="text-right text-xs text-muted-foreground">
              {description.length}/1000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-prod-type">Production type</Label>
            <Select value={productionType} onValueChange={setProductionType}>
              <SelectTrigger id="edit-prod-type" className="cursor-pointer">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {PRODUCTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Separator />

        {/* Schedule */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Schedule</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-prod-start">Start date</Label>
              <Input
                id="edit-prod-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prod-end">End date</Label>
              <Input
                id="edit-prod-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-invalid={!!errors.endDate}
                className="cursor-pointer"
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>
        </section>

        <Separator />

        {/* Location */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Location</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-prod-location">Shooting location</Label>
              <Input
                id="edit-prod-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prod-country">Country</Label>
              <Input
                id="edit-prod-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Budget */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CurrencyGbpIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Budget</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-prod-budget">Budget range</Label>
            <Select value={budgetRange} onValueChange={setBudgetRange}>
              <SelectTrigger id="edit-prod-budget" className="cursor-pointer">
                <SelectValue placeholder="Select range…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {BUDGET_RANGES.map((b) => (
                  <SelectItem key={b.value} value={b.value} className="cursor-pointer">
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This won't be shown publicly — it helps crew gauge the scale of
              the project.
            </p>
          </div>
        </section>

        <Separator />

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateProduction.isPending || !isDirty}
            className="min-w-30 cursor-pointer"
          >
            {updateProduction.isPending ? (
              <>
                <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>

      {/* ── Status change confirmation dialog ──────────── */}
      <AlertDialog
        open={!!pendingStatus}
        onOpenChange={(open) => !open && setPendingStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change production status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the status of <strong>{production.title}</strong>{" "}
              to{" "}
              <strong>
                {PRODUCTION_STATUSES.find((s) => s.value === pendingStatus)
                  ?.label ?? pendingStatus}
              </strong>
              .
              {(pendingStatus === "wrapped" || pendingStatus === "cancelled") &&
                " This signals the production is no longer active."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={changeStatus.isPending}
              className="cursor-pointer"
            >
              {changeStatus.isPending ? "Updating…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}