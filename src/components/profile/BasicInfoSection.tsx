import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { ClearableInput } from "@/components/profile/ClearableInput";
import type { ProfileFormData, ProfileFormErrors } from "@/hooks/useProfileForm";

const BIO_MAX_LENGTH = 500;

type BasicInfoSectionProps = {
  form: ProfileFormData;
  errors: ProfileFormErrors;
  updateField: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => void;
};

export function BasicInfoSection({
  form,
  errors,
  updateField,
}: BasicInfoSectionProps) {
  const bioLength = form.bio.length;
  const bioNearLimit = bioLength > BIO_MAX_LENGTH * 0.8;

  return (
    <section className="space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground">Basic info</h2>

      <Field>
        <FieldLabel htmlFor="display_name">Display name</FieldLabel>
        <ClearableInput
          id="display_name"
          value={form.display_name}
          onChange={(v) => updateField("display_name", v)}
          placeholder="Your full name"
          aria-invalid={!!errors.display_name}
        />
        {errors.display_name && (
          <FieldError>{errors.display_name}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <ClearableInput
          id="username"
          value={form.username}
          onChange={(v) => updateField("username", v.toLowerCase())}
          placeholder="your-username"
          aria-invalid={!!errors.username}
        />
        <FieldDescription>
          Your public URL will be filmcrew.com/crew/{form.username || "..."}
        </FieldDescription>
        {errors.username && <FieldError>{errors.username}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="bio">Bio</FieldLabel>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => {
            if (e.target.value.length <= BIO_MAX_LENGTH) {
              updateField("bio", e.target.value);
            }
          }}
          placeholder="A short introduction about yourself and your work..."
          rows={4}
        />
        <div className="flex justify-between">
          <FieldDescription>
            Tell people about yourself and your work.
          </FieldDescription>
          <span
            className={`text-xs tabular-nums ${
              bioNearLimit ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {bioLength}/{BIO_MAX_LENGTH}
          </span>
        </div>
      </Field>
    </section>
  );
}