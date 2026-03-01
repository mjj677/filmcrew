import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  SpinnerIcon,
  FilmSlateIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyGbpIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateProduction,
  generateProductionSlug,
  checkProductionSlugAvailability,
} from "@/hooks/useProductions";
import type { ProductionCompany, Production } from "@/types/models";

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

// ── Types ─────────────────────────────────────────────────

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type Props = {
  company: ProductionCompany;
};

// ── Component ─────────────────────────────────────────────

export function CreateProductionForm({ company }: Props) {
  const createProduction = useCreateProduction();

  // ── Form state ────────────────────────────────────────

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [description, setDescription] = useState("");
  const [productionType, setProductionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);

  // ── Auto-generate slug from title ─────────────────────

  useEffect(() => {
    if (slugManuallyEdited) return;
    const generated = generateProductionSlug(title);
    setSlug(generated);
    if (generated.length >= 2) {
      setSlugStatus("checking");
    } else {
      setSlugStatus("idle");
    }
  }, [title, slugManuallyEdited]);

  // ── Debounced slug check ──────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const checkSlug = useCallback((value: string) => {
    clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSlugStatus("idle");
      return;
    }

    if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(value)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");

    debounceRef.current = setTimeout(async () => {
      const available = await checkProductionSlugAvailability(value);
      setSlugStatus(available ? "available" : "taken");
    }, 400);
  }, []);

  useEffect(() => {
    checkSlug(slug);
    return () => clearTimeout(debounceRef.current);
  }, [slug, checkSlug]);

  // ── Slug indicator ────────────────────────────────────

  function SlugIndicator() {
    switch (slugStatus) {
      case "checking":
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            Checking…
          </span>
        );
      case "available":
        return (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircleIcon className="h-3.5 w-3.5" weight="fill" />
            Available
          </span>
        );
      case "taken":
        return (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircleIcon className="h-3.5 w-3.5" weight="fill" />
            Already taken
          </span>
        );
      case "invalid":
        return (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircleIcon className="h-3.5 w-3.5" weight="fill" />
            Invalid format
          </span>
        );
      default:
        return null;
    }
  }

  // ── Validation & submit ───────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!title.trim()) {
      e.title = "Production title is required.";
    }

    if (!slug.trim()) {
      e.slug = "URL slug is required.";
    } else if (slugStatus === "taken") {
      e.slug = "This slug is already taken.";
    } else if (slugStatus === "invalid") {
      e.slug = "Lowercase letters, numbers, and hyphens only (2–60 characters).";
    } else if (slugStatus === "checking") {
      e.slug = "Please wait — checking availability.";
    }

    if (startDate && endDate && endDate < startDate) {
      e.endDate = "End date must be after start date.";
    }

    setErrors(e);

    if (e.title) titleRef.current?.focus();
    else if (e.slug) slugRef.current?.focus();

    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createProduction.mutate({
      companyId: company.id,
      companySlug: company.slug,
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      production_type: productionType
        ? (productionType as Production["production_type"])
        : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      location: location.trim() || undefined,
      country: country.trim() || undefined,
      budget_range: budgetRange
        ? (budgetRange as Production["budget_range"])
        : undefined,
    });
  }

  // ── Render ────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Basic info ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FilmSlateIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Production Details</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prod-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={titleRef}
            id="prod-title"
            placeholder="e.g. Lilla Marie"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-slug">
              URL slug <span className="text-destructive">*</span>
            </Label>
            <SlugIndicator />
          </div>
          <div className="flex items-center gap-0 rounded-md border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="shrink-0 select-none border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
              filmcrew.com/productions/
            </span>
            <Input
              ref={slugRef}
              id="prod-slug"
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="lilla-marie"
              value={slug}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                setSlug(v);
                setSlugManuallyEdited(true);
              }}
              aria-invalid={!!errors.slug}
            />
          </div>
          {!slugManuallyEdited && slug && (
            <p className="text-xs text-muted-foreground">
              Auto-generated from title.{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setSlugManuallyEdited(true);
                  slugRef.current?.focus();
                }}
              >
                Edit manually
              </button>
            </p>
          )}
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prod-description">Description</Label>
          <Textarea
            id="prod-description"
            placeholder="Synopsis or project brief…"
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
          <Label htmlFor="prod-type">Production type</Label>
          <Select value={productionType} onValueChange={setProductionType}>
            <SelectTrigger id="prod-type">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      {/* ── Schedule ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Schedule</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prod-start">Start date</Label>
            <Input
              id="prod-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-end">End date</Label>
            <Input
              id="prod-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-invalid={!!errors.endDate}
            />
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate}</p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Location ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Location</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prod-location">Shooting location</Label>
            <Input
              id="prod-location"
              placeholder="e.g. Gothenburg"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-country">Country</Label>
            <Input
              id="prod-country"
              placeholder="e.g. Sweden"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Budget ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CurrencyGbpIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Budget</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prod-budget">Budget range</Label>
          <Select value={budgetRange} onValueChange={setBudgetRange}>
            <SelectTrigger id="prod-budget">
              <SelectValue placeholder="Select range…" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This won't be shown publicly — it helps crew gauge the scale of the project.
          </p>
        </div>
      </section>

      <Separator />

      {/* ── Submit ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Created as a draft. Publish when you're ready to go live.
        </p>
        <Button
          type="submit"
          disabled={createProduction.isPending}
          className="min-w-40"
        >
          {createProduction.isPending ? (
            <>
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create production"
          )}
        </Button>
      </div>
    </form>
  );
}