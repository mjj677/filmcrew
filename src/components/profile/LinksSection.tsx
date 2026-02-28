import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { ClearableInput } from "@/components/profile/ClearableInput";
import type { ProfileFormData, ProfileFormErrors } from "@/hooks/useProfileForm";

type LinksSectionProps = {
  form: ProfileFormData;
  errors: ProfileFormErrors;
  updateField: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => void;
};

export function LinksSection({ form, errors, updateField }: LinksSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground">Links</h2>

      <Field>
        <FieldLabel htmlFor="imdb_url">IMDb</FieldLabel>
        <ClearableInput
          id="imdb_url"
          value={form.imdb_url}
          onChange={(v) => updateField("imdb_url", v)}
          placeholder="https://www.imdb.com/name/nm..."
          aria-invalid={!!errors.imdb_url}
        />
        <FieldDescription>
          Your IMDb profile page URL.
        </FieldDescription>
        {errors.imdb_url && <FieldError>{errors.imdb_url}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="website_url">Website</FieldLabel>
        <ClearableInput
          id="website_url"
          value={form.website_url}
          onChange={(v) => updateField("website_url", v)}
          placeholder="https://yoursite.com"
          aria-invalid={!!errors.website_url}
        />
        <FieldDescription>
          Your personal website or portfolio.
        </FieldDescription>
        {errors.website_url && <FieldError>{errors.website_url}</FieldError>}
      </Field>
    </section>
  );
}