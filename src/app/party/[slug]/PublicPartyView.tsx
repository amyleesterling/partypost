"use client";

import { useEffect, useState } from "react";
import type { PartyData, PublicNote } from "@/lib/sheets";
import { formatPartyDateLong, formatTimeRange, googleMapsUrl } from "@/lib/format";
import { RsvpForm } from "./RsvpForm";
import { NoteWall } from "./NoteWall";
import { CalendarAddButton } from "./CalendarAddButton";
import { StickyRsvpBar } from "./StickyRsvpBar";

export function PublicPartyView({
  slug,
  scriptUrl,
  party,
  notes,
  themeEmoji,
  themeName,
}: {
  slug: string;
  scriptUrl: string;
  party: PartyData;
  notes: PublicNote[];
  themeEmoji: string;
  themeName: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 240);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dateStr = formatPartyDateLong(party.date);
  const timeStr = formatTimeRange(party.start_time, party.end_time);
  const mapHref = party.map_url || googleMapsUrl(party.location_address, party.location_name);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-32 sm:px-6">
      <div
        className="pp-card relative overflow-hidden"
        style={{ minHeight: party.hero_image_url ? "260px" : undefined }}
      >
        {party.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={party.hero_image_url}
            alt=""
            className="block aspect-[16/9] w-full object-cover"
          />
        )}
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center gap-2 text-sm pp-muted">
            <span aria-hidden>{themeEmoji}</span>
            <span>{themeName}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            {party.party_title}
          </h1>
          {party.birthday_age != null && Number(party.birthday_age) > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold"
              style={{ background: "var(--secondary)", color: "var(--ink)" }}
            >
              Turning {party.birthday_age} 🎂
            </div>
          )}
          {party.description && (
            <p className="mt-4 whitespace-pre-wrap text-base pp-muted">
              {party.description}
            </p>
          )}
        </div>
      </div>

      {party.profile_image_url && (
        <div className="mt-6 flex items-center gap-4 pp-card px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={party.profile_image_url}
            alt={party.birthday_child_name}
            className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
          />
          <div>
            <div className="text-sm pp-muted">The birthday star</div>
            <div className="text-xl font-semibold">{party.birthday_child_name}</div>
          </div>
        </div>
      )}

      <section className="mt-6 pp-card px-6 py-5">
        <h2 className="text-lg font-semibold">Party details</h2>
        <dl className="mt-3 grid gap-3 text-sm">
          {(dateStr || timeStr) && (
            <Row label="When">
              {dateStr}
              {dateStr && timeStr && " · "}
              {timeStr}
            </Row>
          )}
          {(party.location_name || party.location_address) && (
            <Row label="Where">
              <div>
                {party.location_name && <div className="font-medium">{party.location_name}</div>}
                {party.location_address && <div className="pp-muted">{party.location_address}</div>}
                {mapHref && (
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-medium underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Open in Maps →
                  </a>
                )}
              </div>
            </Row>
          )}
          {party.rsvp_deadline && (
            <Row label="RSVP by">{formatPartyDateLong(party.rsvp_deadline)}</Row>
          )}
          {party.gift_note && <Row label="Gifts">{party.gift_note}</Row>}
          {party.food_note && <Row label="Food">{party.food_note}</Row>}
          {party.rain_plan && <Row label="Rain plan">{party.rain_plan}</Row>}
          {party.host_name && (
            <Row label="Hosted by">
              {party.host_name}
              {party.host_phone && (
                <a
                  href={`tel:${party.host_phone}`}
                  className="ml-2 underline"
                  style={{ color: "var(--accent)" }}
                >
                  {party.host_phone}
                </a>
              )}
            </Row>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <CalendarAddButton slug={slug} party={party} />
        </div>
      </section>

      <section id="rsvp" className="mt-8 pp-card px-6 py-6">
        <h2 className="text-2xl font-bold">RSVP</h2>
        <p className="mt-1 text-sm pp-muted">
          Let us know who&apos;s coming so we can plan snacks, cupcakes, and tiny celebratory logistics.
        </p>
        <div className="mt-5">
          <RsvpForm slug={slug} scriptUrl={scriptUrl} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Birthday wishes</h2>
        <NoteWall scriptUrl={scriptUrl} notes={notes} />
      </section>

      <footer className="mt-10 text-center text-xs pp-muted">
        🔒 This page is unlisted. Only people with the link can see it.
      </footer>

      <StickyRsvpBar visible={scrolled} />
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem,1fr] items-start gap-3">
      <dt className="text-xs uppercase tracking-wider pp-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
