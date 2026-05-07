"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PartyRow } from "@/lib/supabase/types";

type Slot = "hero" | "profile";

const SLOTS: { key: Slot; label: string; helper: string; field: "hero_image_url" | "profile_image_url" }[] = [
  {
    key: "hero",
    label: "Hero / invitation image",
    helper: "Big top-of-page image. Landscape works best. Try 1600×900.",
    field: "hero_image_url",
  },
  {
    key: "profile",
    label: "Birthday child profile photo",
    helper: "A square crop will look prettiest. About 600×600.",
    field: "profile_image_url",
  },
];

export function ImagesTab({ party }: { party: PartyRow }) {
  const router = useRouter();
  const [uploading, setUploading] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(slot: Slot, file: File) {
    setError(null);
    setUploading(slot);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${party.id}/${slot}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("party-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("party-images").getPublicUrl(path);
      const url = pub.publicUrl;

      const field = slot === "hero" ? "hero_image_url" : "profile_image_url";
      const res = await fetch(`/api/parties/${party.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Could not save image URL");
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function handleRemove(slot: Slot) {
    setError(null);
    const field = slot === "hero" ? "hero_image_url" : "profile_image_url";
    const res = await fetch(`/api/parties/${party.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: null }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Could not remove image");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {SLOTS.map((slot) => {
        const url = party[slot.field];
        return (
          <div key={slot.key} className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">{slot.label}</h3>
              <p className="mt-1 text-sm text-zinc-600">{slot.helper}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                  {uploading === slot.key ? "Uploading…" : url ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(slot.key, f);
                    }}
                  />
                </label>
                {url && (
                  <button
                    type="button"
                    onClick={() => handleRemove(slot.key)}
                    className="text-sm text-zinc-600 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              {url ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={slot.label} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
                  No image yet
                </div>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-zinc-500">
        Images are public so anyone with the party link can see them.
        Don&apos;t upload anything you wouldn&apos;t share with guests.
      </p>
    </div>
  );
}
