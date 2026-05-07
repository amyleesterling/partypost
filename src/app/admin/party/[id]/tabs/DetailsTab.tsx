"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PartyRow } from "@/lib/supabase/types";
import {
  partyCreateSchema,
  type PartyCreateInput,
  type PartyCreateOutput,
} from "@/lib/validation";
import { THEMES, type ThemeKey } from "@/lib/themes";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-500 focus:outline-none";
const labelClass = "block text-sm font-medium text-zinc-800";

export function DetailsTab({ party }: { party: PartyRow }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartyCreateInput, unknown, PartyCreateOutput>({
    resolver: zodResolver(partyCreateSchema),
    defaultValues: {
      birthday_child_name: party.birthday_child_name,
      birthday_age: party.birthday_age,
      party_title: party.party_title,
      description: party.description,
      date: party.date,
      start_time: party.start_time?.slice(0, 5),
      end_time: party.end_time?.slice(0, 5),
      timezone: party.timezone,
      location_name: party.location_name,
      location_address: party.location_address,
      map_url: party.map_url,
      rsvp_deadline: party.rsvp_deadline,
      host_name: party.host_name,
      host_email: party.host_email,
      host_phone: party.host_phone,
      gift_note: party.gift_note,
      food_note: party.food_note,
      rain_plan: party.rain_plan,
      theme: party.theme as ThemeKey,
    },
  });

  const onSubmit: SubmitHandler<PartyCreateOutput> = async (values) => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/parties/${party.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Birthday child&apos;s name</label>
          <input className={inputClass} {...register("birthday_child_name")} />
          {errors.birthday_child_name && (
            <p className="mt-1 text-sm text-red-600">{errors.birthday_child_name.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Age turning</label>
          <input type="number" min={0} className={inputClass} {...register("birthday_age")} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Party title</label>
        <input className={inputClass} {...register("party_title")} />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea rows={3} className={inputClass} {...register("description")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Location name</label>
          <input className={inputClass} {...register("location_name")} />
        </div>
        <div>
          <label className={labelClass}>RSVP deadline</label>
          <input type="date" className={inputClass} {...register("rsvp_deadline")} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input className={inputClass} {...register("location_address")} />
      </div>

      <div>
        <label className={labelClass}>Map URL (optional)</label>
        <input
          className={inputClass}
          {...register("map_url")}
          placeholder="https://maps.google.com/…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Host name</label>
          <input className={inputClass} {...register("host_name")} />
        </div>
        <div>
          <label className={labelClass}>Host email</label>
          <input type="email" className={inputClass} {...register("host_email")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Gift note</label>
          <input className={inputClass} {...register("gift_note")} placeholder="No gifts please…" />
        </div>
        <div>
          <label className={labelClass}>Food note</label>
          <input className={inputClass} {...register("food_note")} placeholder="Pizza & cupcakes" />
        </div>
        <div>
          <label className={labelClass}>Rain plan</label>
          <input className={inputClass} {...register("rain_plan")} placeholder="Move indoors…" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Theme</label>
        <select className={inputClass} {...register("theme")}>
          {Object.values(THEMES).map((t) => (
            <option key={t.key} value={t.key}>
              {t.emoji} {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="text-sm text-emerald-700">Saved!</span>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
