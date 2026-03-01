import { useState } from "react";
import { SpinnerIcon, GlobeIcon, BuildingsIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUpdateCompany } from "@/hooks/useCompanies";
import type { ProductionCompany } from "@/types/models";

type Props = {
  company: ProductionCompany;
};

export function EditCompanyForm({ company }: Props) {
  const updateCompany = useUpdateCompany();

  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description ?? "");
  const [city, setCity] = useState(company.city ?? "");
  const [country, setCountry] = useState(company.country ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(company.website_url ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty =
    name !== company.name ||
    description !== (company.description ?? "") ||
    city !== (company.city ?? "") ||
    country !== (company.country ?? "") ||
    websiteUrl !== (company.website_url ?? "");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Company name is required.";
    if (websiteUrl.trim()) {
      try {
        const url = new URL(websiteUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          e.websiteUrl = "Enter a valid URL.";
        }
      } catch {
        e.websiteUrl = "Enter a valid URL (e.g. https://example.com).";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateCompany.mutate({
      companyId: company.id,
      slug: company.slug,
      name: name.trim(),
      description: description.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      website_url: websiteUrl.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BuildingsIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Company Details</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-name">
            Company name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>URL slug</Label>
          <div className="flex items-center rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            filmcrew.com/companies/{company.slug}
          </div>
          <p className="text-xs text-muted-foreground">
            Slugs cannot be changed after creation.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-city">City</Label>
            <Input
              id="edit-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-country">Country</Label>
            <Input
              id="edit-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GlobeIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Online Presence</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-website">Website</Label>
          <Input
            id="edit-website"
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

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={updateCompany.isPending || !isDirty}
          className="min-w-30"
        >
          {updateCompany.isPending ? (
            <>
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}