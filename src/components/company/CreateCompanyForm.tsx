import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  SpinnerIcon,
  GlobeIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useCreateCompany,
  generateSlug,
  checkSlugAvailability,
} from "@/hooks/useCompanies";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function CreateCompanyForm() {
  const createCompany = useCreateCompany();

  // ── Form state ──────────────────────────────────────────

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // ── Validation ──────────────────────────────────────────

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);

  // ── Auto-generate slug from name ────────────────────────

  useEffect(() => {
    if (slugManuallyEdited) return;
    const generated = generateSlug(name);
    setSlug(generated);
    // Reset slug status when auto-generating
    if (generated.length >= 2) {
      setSlugStatus("checking");
    } else {
      setSlugStatus("idle");
    }
  }, [name, slugManuallyEdited]);

  // ── Debounced slug availability check ───────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const checkSlug = useCallback((value: string) => {
    clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSlugStatus("idle");
      return;
    }

    // Quick client-side format check before hitting the server
    if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(value)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");

    debounceRef.current = setTimeout(async () => {
      const available = await checkSlugAvailability(value);
      setSlugStatus(available ? "available" : "taken");
    }, 400);
  }, []);

  // Trigger check whenever slug changes
  useEffect(() => {
    checkSlug(slug);
    return () => clearTimeout(debounceRef.current);
  }, [slug, checkSlug]);

  // ── Slug status indicator ───────────────────────────────

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

  // ── Submit ──────────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!name.trim()) {
      e.name = "Company name is required.";
    }

    if (!slug.trim()) {
      e.slug = "URL slug is required.";
    } else if (slugStatus === "taken") {
      e.slug = "This slug is already taken.";
    } else if (slugStatus === "invalid") {
      e.slug =
        "Lowercase letters, numbers, and hyphens only (2–60 characters).";
    } else if (slugStatus === "checking") {
      e.slug = "Please wait — checking availability.";
    }

    if (websiteUrl.trim() && !isValidUrl(websiteUrl)) {
      e.websiteUrl = "Enter a valid URL (e.g. https://example.com).";
    }

    setErrors(e);

    // Focus first errored field
    if (e.name) {
      nameRef.current?.focus();
    } else if (e.slug) {
      slugRef.current?.focus();
    }

    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createCompany.mutate({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      website_url: websiteUrl.trim() || undefined,
    });
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Name & Slug ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BuildingsIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Company Details</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-name">
            Company name <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={nameRef}
            id="company-name"
            placeholder="e.g. Lilla Marie Films"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="company-slug">
              URL slug <span className="text-destructive">*</span>
            </Label>
            <SlugIndicator />
          </div>
          <div className="flex items-center gap-0 rounded-md border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="shrink-0 select-none border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
              filmcrew.com/companies/
            </span>
            <Input
              ref={slugRef}
              id="company-slug"
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="lilla-marie-films"
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
              Auto-generated from name.{" "}
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
          <Label htmlFor="company-description">Description</Label>
          <Textarea
            id="company-description"
            placeholder="Tell people what your company does…"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <p className="text-right text-xs text-muted-foreground">
            {description.length}/500
          </p>
        </div>
      </section>

      <Separator />

      {/* ── Location ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Location</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-city">City</Label>
            <Input
              id="company-city"
              placeholder="e.g. Stockholm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-country">Country</Label>
            <Input
              id="company-country"
              placeholder="e.g. Sweden"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Website ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Online Presence</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-website">Website</Label>
          <Input
            id="company-website"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            aria-invalid={!!errors.websiteUrl}
          />
          {errors.websiteUrl && (
            <p className="text-sm text-destructive">{errors.websiteUrl}</p>
          )}
        </div>
      </section>

      <Separator />

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          You'll be the owner. You can invite team members afterwards.
        </p>
        <Button
          type="submit"
          disabled={createCompany.isPending}
          className="min-w-35"
        >
          {createCompany.isPending ? (
            <>
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create company"
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Helpers ─────────────────────────────────────────────────

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}