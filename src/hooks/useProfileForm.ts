import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useProfile, useInvalidateProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/models";

export type ProfileFormData = {
  display_name: string;
  username: string;
  bio: string;
  position: string;
  location: string;
  country: string;
  experience_years: number | null;
  availability_status: string;
  showreel_url: string;
  imdb_url: string;
  website_url: string;
  skills: string[];
  profile_image_url: string | null;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormData, string>>;

function buildInitialForm(profile: Profile | null): ProfileFormData {
  return {
    display_name: profile?.display_name ?? "",
    username: profile?.username ?? "",
    bio: profile?.bio ?? "",
    position: profile?.position ?? "",
    location: profile?.location ?? "",
    country: profile?.country ?? "",
    experience_years: profile?.experience_years ?? null,
    availability_status: profile?.availability_status ?? "available",
    showreel_url: profile?.showreel_url ?? "",
    imdb_url: profile?.imdb_url ?? "",
    website_url: profile?.website_url ?? "",
    skills: profile?.skills ?? [],
    profile_image_url: profile?.profile_image_url ?? null,
  };
}

function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

function isValidImdbUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "www.imdb.com" || parsed.hostname === "imdb.com";
  } catch {
    return false;
  }
}

function isValidWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Scroll to the first field that has a validation error */
function scrollToFirstError(errors: ProfileFormErrors) {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;

    const el =
        document.getElementById(firstKey) ??
        document.querySelector(`[name="${firstKey}"]`);

    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLElement) el.focus();
    }
}

async function saveProfile(
  userId: string,
  form: ProfileFormData,
  isFirstTime: boolean,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        bio: form.bio.trim() || null,
        position: form.position || null,
        location: form.location.trim() || null,
        country: form.country.trim() || null,
        experience_years: form.experience_years,
        availability_status: form.availability_status,
        showreel_url: form.showreel_url.trim() || null,
        imdb_url: form.imdb_url.trim() || null,
        website_url: form.website_url.trim() || null,
        skills: form.skills.length > 0 ? form.skills : null,
        ...(isFirstTime && { has_completed_setup: true }),
    })
    .eq("id", userId);

  if (error) throw error;
}

export function useProfileForm() {
    const { user } = useAuth();
    const { profile, isLoading } = useProfile();
    const invalidateProfile = useInvalidateProfile();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();

    const isSetup = searchParams.get("setup") === "1";
    const isFirstTime = isSetup || !profile?.has_completed_setup;

    const [form, setForm] = useState<ProfileFormData>(() => buildInitialForm(profile));
    const [errors, setErrors] = useState<ProfileFormErrors>({});
    const [isDirty, setIsDirty] = useState(false);

    // Track the "clean" state so we can compare for dirty detection
    const cleanForm = useRef<ProfileFormData>(buildInitialForm(null));

    // Populate form when profile loads
    useEffect(() => {
        if (profile) {
        const initial = buildInitialForm(profile);
        setForm(initial);
        cleanForm.current = initial;
        setIsDirty(false);
        }
    }, [profile]);

    const mutation = useMutation({
        mutationFn: () => saveProfile(user!.id, form, !!isFirstTime),
        onSuccess: async () => {
        setIsDirty(false);
        cleanForm.current = { ...form };
        await Promise.all([
            invalidateProfile(),
            queryClient.invalidateQueries({ queryKey: ["crew-profile"] }),
            queryClient.invalidateQueries({ queryKey: ["crew"] }),
        ]);

        if (isFirstTime) {
            toast.success("Welcome to FilmCrew!", {
            description: "Your profile is all set.",
            });
            navigate("/home", { replace: true });
        } else {
            toast.success("Profile saved", {
            description: "Your changes are live.",
            });
            navigate(`/crew/${form.username.trim().toLowerCase()}`, {
            replace: true,
            });
        }
        },
        onError: (error: { code?: string; message?: string }) => {
        if (error.code === "23505" && error.message?.includes("username")) {
            const usernameError = { username: "This username is already taken." };
            setErrors(usernameError);
            scrollToFirstError(usernameError);
            toast.error("Username unavailable", {
            description: "That username is already taken. Please choose another.",
            });
        } else {
            toast.error("Error saving profile", {
            description: "Something went wrong. Please try again.",
            });
            console.error("Profile update error:", error);
        }
        },
    });

    const updateField = useCallback(
        <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value };
            // Check if form differs from clean state
            setIsDirty(
            JSON.stringify(next) !== JSON.stringify(cleanForm.current),
            );
            return next;
        });
        setErrors((prev) => {
            if (!prev[key]) return prev;
            return { ...prev, [key]: undefined };
        });
        },
        [],
    );

    function validate(): ProfileFormErrors {
        const errs: ProfileFormErrors = {};

        if (!form.display_name.trim()) {
        errs.display_name = "Display name is required.";
        }

        if (!form.username.trim()) {
        errs.username = "Username is required.";
        } else if (!/^[a-z0-9_-]+$/.test(form.username)) {
        errs.username =
            "Username can only contain lowercase letters, numbers, hyphens, and underscores.";
        } else if (form.username.length < 3) {
        errs.username = "Username must be at least 3 characters.";
        }

        if (form.showreel_url && !isValidYouTubeUrl(form.showreel_url)) {
        errs.showreel_url = "Please enter a valid YouTube URL.";
        }

        if (form.imdb_url && !isValidImdbUrl(form.imdb_url)) {
        errs.imdb_url = "Please enter a valid IMDb URL.";
        }

        if (form.website_url && !isValidWebUrl(form.website_url)) {
        errs.website_url = "Please enter a valid URL.";
        }

        return errs;
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        scrollToFirstError(validationErrors);
        toast.error("Missing required fields", {
            description: "Please fix the highlighted fields before saving.",
        });
        return;
        }

        mutation.mutate();
    }

    return {
        form,
        errors,
        isSaving: mutation.isPending,
        isDirty,
        isFirstTime,
        isReady: !isLoading && !!profile,
        userId: user?.id ?? null,
        updateField,
        handleSave,
    };
}