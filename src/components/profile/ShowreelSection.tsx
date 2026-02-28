import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ClearableInput } from "@/components/profile/ClearableInput";
import { ShowreelPlayer } from "@/components/profile/ShowreelPlayer";
import type { ProfileFormData, ProfileFormErrors } from "@/hooks/useProfileForm";

type ShowreelSectionProps = {
  form: ProfileFormData;
  errors: ProfileFormErrors;
  updateField: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => void;
};

export function ShowreelSection({
  form,
  errors,
  updateField,
}: ShowreelSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground">Showreel</h2>

      <Field>
        <FieldLabel htmlFor="showreel_url">YouTube URL</FieldLabel>
        <ClearableInput
          id="showreel_url"
          value={form.showreel_url}
          onChange={(v) => updateField("showreel_url", v)}
          placeholder="https://www.youtube.com/watch?v=..."
          aria-invalid={!!errors.showreel_url}
        />
        {errors.showreel_url && (
          <FieldError>{errors.showreel_url}</FieldError>
        )}
      </Field>

      <ShowreelPlayer url={form.showreel_url} />
    </section>
  );
}