"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partyCreateSchema, type PartyCreateInput, type PartyCreateOutput } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-500 focus:outline-none";
const labelClass = "block text-sm font-medium text-zinc-800";

export function NewPartyForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartyCreateInput, unknown, PartyCreateOutput>({
    resolver: zodResolver(partyCreateSchema),
    defaultValues: { theme: "default" },
  });

  const onSubmit: SubmitHandler<PartyCreateOutput> = async (values) => {
    setSubmitError(null);
    const res = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data?.error || "Could not create party");
      return;
    }
    const data: { id: string } = await res.json();
    router.push(`/admin/party/${data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Birthday child&apos;s name</label>
        <input className={inputClass} {...register("birthday_child_name")} placeholder="Sophia" />
        {errors.birthday_child_name && (
          <p className="mt-1 text-sm text-red-600">{errors.birthday_child_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Age turning</label>
          <input
            type="number"
            min={0}
            max={120}
            className={inputClass}
            {...register("birthday_age")}
            placeholder="7"
          />
        </div>
        <div>
          <label className={labelClass}>Theme</label>
          <select className={inputClass} {...register("theme")}>
            <option value="default">Soft Default</option>
            <option value="beach">Beach Birthday</option>
            <option value="princess">Princess Picnic</option>
            <option value="woodland">Woodland Party</option>
            <option value="space">Space Adventure</option>
            <option value="rainbow">Rainbow Art Party</option>
            <option value="science">Science Party</option>
            <option value="garden-tea">Garden Tea Party</option>
            <option value="arcade">Arcade Party</option>
            <option value="dinosaur">Dinosaur Bash</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Party title</label>
        <input
          className={inputClass}
          {...register("party_title")}
          placeholder="Sophia's 7th Birthday Party"
        />
        {errors.party_title && (
          <p className="mt-1 text-sm text-red-600">{errors.party_title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" className={inputClass} {...register("date")} />
        </div>
        <div>
          <label className={labelClass}>Start</label>
          <input type="time" className={inputClass} {...register("start_time")} />
        </div>
        <div>
          <label className={labelClass}>End</label>
          <input type="time" className={inputClass} {...register("end_time")} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Location name</label>
        <input
          className={inputClass}
          {...register("location_name")}
          placeholder="Arlington Reservoir Beach"
        />
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input
          className={inputClass}
          {...register("location_address")}
          placeholder="422 Lowell St, Arlington, MA"
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={3}
          className={inputClass}
          {...register("description")}
          placeholder="Come celebrate with sunshine and snacks…"
        />
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create party"}
        </button>
      </div>
    </form>
  );
}
