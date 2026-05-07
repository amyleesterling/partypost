"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rsvpSchema, type RsvpInput, type RsvpOutput } from "@/lib/validation";
import type { PartyRow, RsvpRow } from "@/lib/supabase/types";

export function RsvpForm({
  party,
  initial,
  editToken,
}: {
  party: PartyRow;
  initial?: RsvpRow;
  editToken?: string;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RsvpInput, unknown, RsvpOutput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      status: initial?.status ?? "yes",
      parent_names: initial?.parent_names ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      child_names: initial?.child_names ?? "",
      kids_count: initial?.kids_count ?? 1,
      adults_count: initial?.adults_count ?? 1,
      allergy_notes: initial?.allergy_notes ?? "",
      private_note: initial?.private_note ?? "",
      public_note: initial?.public_note ?? "",
      public_note_consent: initial?.public_note_consent ?? false,
    },
  });

  const status = watch("status");
  const isEdit = !!editToken;

  const onSubmit: SubmitHandler<RsvpOutput> = async (values) => {
    setSubmitError(null);
    const url = isEdit ? `/api/rsvps/${editToken}` : `/api/public/parties/${party.slug}/rsvps`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data?.error || "Something went wrong. Please try again.");
      return;
    }

    const data = await res.json();
    if (isEdit) {
      router.refresh();
      // Stay on edit page with a success flash.
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const token: string = data.edit_token;
    router.push(`/party/${party.slug}/rsvp/thanks?t=${token}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold">Will you be there?</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["yes", "maybe", "no"] as const).map((s) => (
            <label
              key={s}
              className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium ${
                status === s
                  ? "border-transparent text-white"
                  : "border-zinc-300 bg-white text-zinc-800"
              }`}
              style={status === s ? { background: "var(--accent)" } : undefined}
            >
              <input type="radio" value={s} className="sr-only" {...register("status")} />
              {s === "yes" && "✨ Yes!"}
              {s === "maybe" && "🤔 Maybe"}
              {s === "no" && "😢 Can't"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name(s)" error={errors.parent_names?.message}>
          <input
            className="pp-input"
            placeholder="Alex & Sam Chen"
            {...register("parent_names")}
          />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            className="pp-input"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isEdit}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" error={errors.phone?.message}>
          <input
            type="tel"
            className="pp-input"
            placeholder="(555) 555-5555"
            {...register("phone")}
          />
        </Field>
        <Field label="Child name(s)" error={errors.child_names?.message}>
          <input
            className="pp-input"
            placeholder="Jordan, Mia"
            {...register("child_names")}
          />
        </Field>
      </div>

      {status !== "no" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kids attending" error={errors.kids_count?.message}>
            <input
              type="number"
              min={0}
              max={50}
              className="pp-input"
              {...register("kids_count")}
            />
          </Field>
          <Field label="Adults attending" error={errors.adults_count?.message}>
            <input
              type="number"
              min={0}
              max={50}
              className="pp-input"
              {...register("adults_count")}
            />
          </Field>
        </div>
      )}

      <Field label="Allergies / dietary notes (optional)">
        <input
          className="pp-input"
          placeholder="Tree nut allergy, gluten-free, etc."
          {...register("allergy_notes")}
        />
      </Field>

      <Field label="Private note to host (optional)" error={errors.private_note?.message}>
        <textarea rows={2} className="pp-textarea" {...register("private_note")} />
      </Field>

      <Field label="Birthday wish (optional, shown on the note wall)" error={errors.public_note?.message}>
        <textarea
          rows={2}
          className="pp-textarea"
          placeholder="Happy birthday! Can't wait to celebrate."
          {...register("public_note")}
        />
        <label className="mt-2 flex items-start gap-2 text-sm pp-muted">
          <input type="checkbox" {...register("public_note_consent")} className="mt-1" />
          <span>Yes, you can share this on the note wall (after host approval).</span>
        </label>
        {errors.public_note_consent && (
          <p className="mt-1 text-sm text-red-600">{errors.public_note_consent.message}</p>
        )}
      </Field>

      {submitError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="pp-button w-full text-base"
      >
        {isSubmitting ? "Sending…" : isEdit ? "Update RSVP" : "Send RSVP"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
