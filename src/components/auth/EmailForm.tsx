import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function EmailForm() {
  const { signInWithOTP } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setSubmitting(true);

    const { error } = await signInWithOTP(email);

    setSubmitting(false);

    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border p-4 text-center">
        <p className="text-sm font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a sign-in link to {email}
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send magic link"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}