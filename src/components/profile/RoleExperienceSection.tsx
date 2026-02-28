import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  POSITIONS,
  AVAILABILITY_OPTIONS,
  EXPERIENCE_RANGES,
} from "@/lib/constants";
import type { ProfileFormData } from "@/hooks/useProfileForm";

type RoleExperienceSectionProps = {
  form: ProfileFormData;
  updateField: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => void;
};

export function RoleExperienceSection({
  form,
  updateField,
}: RoleExperienceSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground">
        Role & experience
      </h2>

      <Field>
        <FieldLabel>Position</FieldLabel>
        <Select
          value={form.position}
          onValueChange={(v) => updateField("position", v)}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Select your primary role" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60">
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos} className="cursor-pointer">
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Experience</FieldLabel>
        <Select
          value={
            form.experience_years !== null
              ? String(form.experience_years)
              : ""
          }
          onValueChange={(v) =>
            updateField("experience_years", v ? Number(v) : null)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Years of experience" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60" side="bottom" avoidCollisions={false}>
            {EXPERIENCE_RANGES.map((r) => (
              <SelectItem key={r.value} value={String(r.value)} className="cursor-pointer">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Availability</FieldLabel>
        <Select
          value={form.availability_status}
          onValueChange={(v) => updateField("availability_status", v)}
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {AVAILABILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${opt.color}`}
                  />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </section>
  );
}