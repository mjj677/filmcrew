import { useState } from "react";
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyGbpIcon,
  CalendarIcon,
  SpinnerIcon,
  GlobeIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateJob } from "@/hooks/useJobs";

// ── Constants ─────────────────────────────────────────────

const JOB_CATEGORIES = [
  "Camera & Lighting",
  "Direction & Production",
  "Post-Production",
  "Sound",
  "Art & Design",
  "Wardrobe & Makeup",
  "Writing",
  "Performance",
  "Other",
] as const;

const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "daily_rate", label: "Daily rate" },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Head of Dept" },
  { value: "any", label: "Any experience" },
] as const;

const NONE = "__none__";

// ── Props ─────────────────────────────────────────────────

type Props = {
  productionId: string;
  productionSlug: string;
  productionTitle: string;
};

// ── Component ─────────────────────────────────────────────

export function CreateJobForm({
  productionId,
  productionSlug,
  productionTitle,
}: Props) {
  const createJob = useCreateJob();

  // ── Form state ────────────────────────────────────────

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(NONE);
  const [type, setType] = useState(NONE);
  const [experienceLevel, setExperienceLevel] = useState(NONE);
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [compensation, setCompensation] = useState("");
  const [deadline, setDeadline] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation ────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Job title is required.";
    if (!description.trim()) e.description = "A job description is required.";
    if (description.trim().length < 20)
      e.description = "Description should be at least 20 characters.";
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate < new Date()) {
        e.deadline = "Deadline must be in the future.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createJob.mutate({
      productionId,
      productionSlug,
      title: title.trim(),
      description: description.trim(),
      category: category === NONE ? undefined : category,
      type: type === NONE ? undefined : type,
      experience_level: experienceLevel === NONE ? undefined : experienceLevel,
      location: location.trim() || undefined,
      is_remote: isRemote,
      compensation: compensation.trim() || undefined,
      deadline: deadline || undefined,
    });
  }

  // ── Render ────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Role info ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Role Details</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Posting to <strong>{productionTitle}</strong>
        </p>

        <div className="space-y-2">
          <Label htmlFor="job-title">
            Job title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="job-title"
            placeholder="e.g. Director of Photography, Sound Mixer, 1st AD"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="job-description"
            placeholder="Describe the role, responsibilities, requirements, and any other details crew should know…"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            aria-invalid={!!errors.description}
          />
          <div className="flex items-center justify-between">
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="ml-auto text-xs text-muted-foreground">
              {description.length}/5000
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="job-category" className="cursor-pointer">
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE} className="cursor-pointer">Any category</SelectItem>
                {JOB_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="cursor-pointer">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-type">Engagement type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="job-type" className="cursor-pointer">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not specified</SelectItem>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-experience">Experience level</Label>
          <Select value={experienceLevel} onValueChange={setExperienceLevel}>
            <SelectTrigger id="job-experience" className="sm:max-w-xs">
              <SelectValue placeholder="Select level…" className="cursor-pointer"/>
            </SelectTrigger>
            <SelectContent className="cursor-pointer">
              <SelectItem value={NONE} className="cursor-pointer">Not specified</SelectItem>
              {EXPERIENCE_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="cursor-pointer">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator />

      {/* ── Location ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Location</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-location">Location</Label>
          <Input
            id="job-location"
            placeholder="e.g. Stockholm, London, Los Angeles"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="job-remote"
            checked={isRemote}
            onCheckedChange={setIsRemote}
            className="cursor-pointer"
          />
          <Label
            htmlFor="job-remote"
            className="flex cursor-pointer items-center gap-1.5 text-sm"
          >
            <GlobeIcon className="h-4 w-4 text-muted-foreground" />
            Remote work possible
          </Label>
        </div>
      </section>

      <Separator />

      {/* ── Compensation & deadline ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CurrencyGbpIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Compensation & Deadline</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-compensation">Compensation</Label>
            <Input
              id="job-compensation"
              placeholder="e.g. £300/day, £2,500/week, TBD"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Free text — include rate, currency, and period.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="job-deadline">Application deadline</Label>
            </div>
            <Input
              id="job-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={!!errors.deadline}
              className="cursor-pointer"
            />
            {errors.deadline && (
              <p className="text-sm text-destructive">{errors.deadline}</p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Submit ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          The job will be visible immediately if the production is published.
        </p>
        <Button
          type="submit"
          disabled={createJob.isPending}
          className="min-w-36 cursor-pointer"
        >
          {createJob.isPending ? (
            <>
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
              Posting…
            </>
          ) : (
            "Post job"
          )}
        </Button>
      </div>
    </form>
  );
}