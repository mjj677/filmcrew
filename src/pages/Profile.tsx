import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FloppyDiskIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";
import { BasicInfoSection } from "@/components/profile/BasicInfoSection";
import { RoleExperienceSection } from "@/components/profile/RoleExperienceSection";
import { LocationSection } from "@/components/profile/LocationSection";
import { SkillsSection } from "@/components/profile/SkillsSection";
import { ShowreelSection } from "@/components/profile/ShowreelSection";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { useProfileForm } from "@/hooks/useProfileForm";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { LinksSection } from "@/components/profile/LinksSection";

function Profile() {
  const navigate = useNavigate();
  const {
    form,
    errors,
    isSaving,
    isDirty,
    isFirstTime,
    isReady,
    userId,
    updateField,
    handleSave,
  } = useProfileForm();

  useNavigationGuard(isDirty && !isSaving);

  if (!isReady || !userId) {
    return (
      <>
        <Helmet>
          <title>Profile | FilmCrew</title>
        </Helmet>
        <ProfileSkeleton />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {isFirstTime ? "Complete Your Profile" : "Edit Profile"} | FilmCrew
        </title>
      </Helmet>

      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFirstTime ? "Complete your profile" : "Edit profile"}
          </h1>
          {isFirstTime && (
            <p className="mt-1 text-sm text-muted-foreground">
              Tell the crew a bit about yourself. You can always update this
              later.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <section className="flex justify-center">
            <ProfileImageUpload
              userId={userId}
              currentUrl={form.profile_image_url}
              displayName={form.display_name}
              onUploaded={(url) => updateField("profile_image_url", url)}
            />
          </section>

          <Separator />
          <BasicInfoSection form={form} errors={errors} updateField={updateField} />
          <Separator />
          <RoleExperienceSection form={form} updateField={updateField} />
          <Separator />
          <LocationSection form={form} updateField={updateField} />
          <Separator />
          <LinksSection form={form} errors={errors} updateField={updateField} />
          <Separator />
          <SkillsSection form={form} updateField={updateField} />
          <Separator />
          <ShowreelSection form={form} errors={errors} updateField={updateField} />
          <Separator />

          <div className="flex items-center gap-3 pb-8">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <SpinnerGapIcon size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FloppyDiskIcon size={16} />
                  {isFirstTime ? "Complete profile" : "Save changes"}
                </>
              )}
            </Button>

            {!isFirstTime && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

    </>
  );
}

export default Profile;