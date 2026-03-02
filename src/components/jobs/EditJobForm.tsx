import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyGbpIcon,
  CalendarIcon,
  SpinnerIcon,
  GlobeIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateJob, useToggleJobActive } from "@/hooks/useJobs";
import type { JobWithContext } from "@/hooks/useJobs";

// ── Constants (mirrors CreateJobForm) ─────────────────────

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
  job: JobWithContext;
};

// ── Component ─────────────────────────────────────────────

export function EditJobForm({ job }: Props) {
  const navigate = useNavigate();
  const updateJob = useUpdateJob();
  const toggleActive = useToggleJobActive();

  // ── Form state (pre-filled from existing job) ─────────

  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description ?? "");
  const [category, setCategory] = useState(job.category ?? NONE);
  const [type, setType] = useState(job.type ?? NONE);
  const [experienceLevel, setExperienceLevel] = useState(
    job.experience_level ?? NONE
  );
  const [location, setLocation] = useState(job.location ?? "");
  const [isRemote, setIsRemote] = useState(job.is_remote ?? false);
  const [compensation, setCompensation] = useState(job.compensation ?? "");
  const [deadline, setDeadline] = useState(
    // Normalise to YYYY-MM-DD for the date input
    job.deadline ? job.deadline.slice(0, 10) : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Dirty tracking ────────────────────────────────────

  const isDirty =
    title !== job.title ||
    description !== (job.description ?? "") ||
    category !== (job.category ?? NONE) ||
    type !== (job.type ?? NONE) ||
    experienceLevel !== (job.experience_level ?? NONE) ||
    location !== (job.location ?? "") ||
    isRemote !== (job.is_remote ?? false) ||
    compensation !== (job.compensation ?? "") ||
    deadline !== (job.deadline ? job.deadline.slice(0, 10) : "");

  // ── Validation ────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Job title is required.";
    if (!description.trim()) e.description = "A job description is required.";
    if (description.trim().length < 20)
      e.description = "Description should be at least 20 characters.";

    // Only error on deadline if it's been changed to a new past date.
    // Leaving an existing past deadline untouched is fine.
    if (deadline && deadline !== (job.deadline ? job.deadline.slice(0, 10) : "")) {
      if (new Date(deadline) < new Date()) {
        e.deadline = "New deadline must be in the future.";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ─────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateJob.mutate(
      {
        jobId: job.id,
        title: title.trim(),
        description: description.trim(),
        category: category === NONE ? null : category,
        type: type === NONE ? null : type,
        experience_level: experienceLevel === NONE ? null : experienceLevel,
        location: location.trim() || null,
        is_remote: isRemote,
        compensation: compensation.trim() || null,
        deadline: deadline || null,
      },
      {
        onSuccess: () => navigate(`/jobs/${job.id}`),
      }
    );
  }

  function handleToggleActive() {
    toggleActive.mutate({ jobId: job.id, isActive: !job.is_active });
  }

  const isActing = updateJob.isPending || toggleActive.isPending;

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Status & Visibility ──────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Status & Visibility</h2>

        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Listing status</p>
              <Badge
                variant="secondary"
                className={
                  job.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-stone-100 text-stone-600"
                }
              >
                {job.is_active ? "Open" : "Closed"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {job.is_active
                ? "This listing is visible to applicants. Close it when the role is filled."
                : "This listing is hidden from applicants. Reopen it to accept applications again."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer"
            disabled={isActing}
            onClick={handleToggleActive}
          >
            {toggleActive.isPending ? (
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : job.is_active ? (
              <EyeSlashIcon className="mr-2 h-4 w-4" />
            ) : (
              <EyeIcon className="mr-2 h-4 w-4" />
            )}
            {job.is_active ? "Close listing" : "Reopen listing"}
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Role details form ─────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Role Details</h2>
          </div>

          {job.production && (
            <p className="text-sm text-muted-foreground">
              Listed under <strong>{job.production.title}</strong>
            </p>
          )}

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
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              aria-invalid={!!errors.description}
            />
            <div className="flex justify-between">
              {errors.description ? (
                <p className="text-sm text-destructive">{errors.description}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">
                {description.length}/5000
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={NONE} className="cursor-pointer">
                    No category
                  </SelectItem>
                  {JOB_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="cursor-pointer">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Job type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={NONE} className="cursor-pointer">
                    Not specified
                  </SelectItem>
                  {JOB_TYPES.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="cursor-pointer"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience level</Label>
              <Select
                value={experienceLevel}
                onValueChange={setExperienceLevel}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={NONE} className="cursor-pointer">
                    Not specified
                  </SelectItem>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <SelectItem
                      key={l.value}
                      value={l.value}
                      className="cursor-pointer"
                    >
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Location & Compensation ───────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Location & Compensation</h2>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-4">
            <GlobeIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Remote role</p>
              <p className="text-xs text-muted-foreground">
                Can this role be performed remotely?
              </p>
            </div>
            <Switch
              checked={isRemote}
              onCheckedChange={setIsRemote}
              className="cursor-pointer"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job-location">Location</Label>
              <Input
                id="job-location"
                placeholder="e.g. London, Glasgow, On location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CurrencyGbpIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="job-compensation">Compensation</Label>
              </div>
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

        {/* ── Submit ───────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isDirty ? "You have unsaved changes." : "No changes yet."}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate(`/jobs/${job.id}`)}
              disabled={isActing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isActing}
              className="cursor-pointer"
            >
              {updateJob.isPending ? (
                <>
                  <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}