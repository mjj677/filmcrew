import { Field, FieldLabel } from "@/components/ui/field";
import { ClearableInput } from "@/components/profile/ClearableInput";
import type { ProfileFormData } from "@/hooks/useProfileForm";

type LocationSectionProps = {
  form: ProfileFormData;
  updateField: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => void;
};

export function LocationSection({ form, updateField }: LocationSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground">Location</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="location">City / Region</FieldLabel>
          <ClearableInput
            id="location"
            value={form.location}
            onChange={(v) => updateField("location", v)}
            placeholder="e.g. London"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <ClearableInput
            id="country"
            value={form.country}
            onChange={(v) => updateField("country", v)}
            placeholder="e.g. United Kingdom"
          />
        </Field>
      </div>
    </section>
  );
}