"use client";

import { useEffect, useState } from "react";
import type { PartyData, PublicNote } from "@/lib/sheets";
import { bannerImage } from "@/lib/partyImages";
import { formatPartyDateLong, formatTimeRange, googleMapsEmbedUrl, googleMapsUrl } from "@/lib/format";
import { RsvpForm } from "./RsvpForm";
import { NoteWall } from "./NoteWall";
import { CalendarAddButton } from "./CalendarAddButton";
import { StickyRsvpBar } from "./StickyRsvpBar";
import { Countdown } from "./Countdown";
import { HypeCountdown, useHypeMode } from "./HypeCountdown";
import { IdleConfetti } from "./IdleConfetti";
import { RisingBubbles } from "./RisingBubbles";

export function PublicPartyView({
  slug,
  scriptUrl,
  isDemo,
  party,
  notes,
  inviteToken,
}: {
  slug: string;
  scriptUrl?: string;
  isDemo?: boolean;
  party: PartyData;
  notes: PublicNote[];
  inviteToken?: string | null;
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
  const mapEmbedSrc = googleMapsEmbedUrl(party.location_address, party.location_name);
  const hype = useHypeMode(party.date, party.start_time, party.end_time);
  const heroSrc = bannerImage(party);

  return (
    <>
      <RisingBubbles />
      <IdleConfetti />

      {/* Full-bleed banner hero with a slow ken-burns drift */}
      {heroSrc && (
        <div className="pp-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt={party.party_title} className="pp-banner-img" />
        </div>
      )}

      <main
        className={`relative z-10 mx-auto max-w-2xl px-4 pb-32 sm:px-6 ${
          heroSrc ? "-mt-4 sm:-mt-8" : "pt-8 sm:pt-10"
        }`}
      >
        {/* Within 48h of the party the countdown swaps for the hype-mode
            takeover (see docs/hype-mode.md) */}
        <div className="pp-enter">
          {hype ? (
            <HypeCountdown
              date={party.date}
              startTime={party.start_time}
              endTime={party.end_time}
              childName={party.birthday_child_name}
            />
          ) : (
            <div className="pp-card px-6 py-5 sm:px-8">
              <Countdown date={party.date} startTime={party.start_time} />
            </div>
          )}
        </div>

        {/* RSVP — leads with the description, then the form */}
        <section id="rsvp" className="pp-enter mt-8 pp-card px-6 py-7 sm:px-8 sm:py-8" style={{ animationDelay: "0.08s" }}>
          {party.description && (
            <p className="mb-6 whitespace-pre-wrap text-[1.0625rem] leading-relaxed pp-muted">
              {party.description}
            </p>
          )}
          <span className="pp-section-rule" />
          <h2 className="flex items-baseline gap-3 text-3xl font-bold tracking-tight">
            <span>RSVP</span>
            <span aria-hidden className="pp-wiggle inline-block text-2xl">🎉</span>
          </h2>
          <div className="mt-6">
            <RsvpForm
              slug={slug}
              scriptUrl={scriptUrl}
              isDemo={isDemo}
              inviteToken={inviteToken}
            />
          </div>
        </section>

        {party.profile_image_url && (
          <div className="pp-enter mt-6 flex items-center gap-5 pp-card px-6 py-5" style={{ animationDelay: "0.16s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={party.profile_image_url}
              alt={party.birthday_child_name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
            />
            <div>
              <div className="text-xs uppercase tracking-widest pp-muted">The birthday star</div>
              <div className="mt-0.5 text-xl font-semibold">{party.birthday_child_name}</div>
            </div>
          </div>
        )}

        <section className="pp-enter mt-6 pp-card px-6 py-6 sm:px-8 sm:py-7" style={{ animationDelay: "0.24s" }}>
          <span className="pp-section-rule" />
          <h2 className="text-2xl font-bold tracking-tight">Party details</h2>
          <dl className="mt-5 grid gap-4 text-[0.95rem]">
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
                  {party.location_name && <div className="font-semibold">{party.location_name}</div>}
                  {party.location_address && <div className="pp-muted">{party.location_address}</div>}
                  {mapHref && (
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-block text-sm font-semibold underline-offset-4 hover:underline"
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
                    className="ml-2 underline-offset-4 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {party.host_phone}
                  </a>
                )}
              </Row>
            )}
          </dl>
          {mapEmbedSrc && (
            <div className="mt-5 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
              <iframe
                src={mapEmbedSrc}
                title={`Map to ${party.location_name || party.location_address}`}
                className="block h-64 w-full border-0 sm:h-72"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <CalendarAddButton slug={slug} party={party} />
          </div>
        </section>

        <section className="pp-enter mt-8" style={{ animationDelay: "0.32s" }}>
          <span className="pp-section-rule" />
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Birthday wishes</h2>
          <NoteWall scriptUrl={scriptUrl} isDemo={isDemo} notes={notes} />
        </section>

        {isDemo && (
          <div className="mt-6 rounded-2xl bg-white/85 px-5 py-4 text-center text-sm font-medium text-zinc-700 shadow-sm">
            ✨ This is a public PartyPost demo. RSVPs and wishes here aren&apos;t saved.
            <br />
            Fork the repo to make your own:{" "}
            <a
              href="https://github.com/amyleesterling/partypost"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline-offset-4 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              github.com/amyleesterling/partypost
            </a>
          </div>
        )}

        <footer className="mt-12 text-center text-xs pp-muted">
          🔒 This page is unlisted. Only people with the link can see it.
        </footer>

        <StickyRsvpBar visible={scrolled} />
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem,1fr] items-start gap-4">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] pp-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
