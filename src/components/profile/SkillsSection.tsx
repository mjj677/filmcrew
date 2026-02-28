import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { SkillsPicker } from "@/components/profile/SkillsPicker";
import type { ProfileFormData } from "@/hooks/useProfileForm";

type SkillsSectionProps = {
  form: ProfileFormData;
  updateField: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => void;
};

export function SkillsSection({ form, updateField }: SkillsSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground">Skills</h2>

      <Field>
        <FieldLabel>Your skills</FieldLabel>
        <FieldDescription>
          Select from the list or add your own.
        </FieldDescription>
        <SkillsPicker
          value={form.skills}
          onChange={(skills) => updateField("skills", skills)}
        />
      </Field>
    </section>
  );
}