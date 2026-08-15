"use client";

import { useEffect, useState } from "react";
import type { PartyData, PublicNote } from "@/lib/sheets";
import { bannerImage } from "@/lib/partyImages";
import { formatPartyDate, formatTimeRange, googleMapsEmbedUrl, googleMapsUrl } from "@/lib/format";
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

  const dateStr = formatPartyDate(party.date);
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

        {/* The essentials — emoji-led rows, no headings */}
        <section className="pp-enter mt-6 pp-card px-6 py-6 sm:px-8 sm:py-7" style={{ animationDelay: "0.08s" }}>
          <div className="grid gap-3.5 text-[1rem]">
            {(dateStr || timeStr) && (
              <Fact emoji="📅">
                <span className="font-semibold">{dateStr}</span>
                {dateStr && timeStr && " · "}
                {timeStr}
              </Fact>
            )}
            {(party.location_name || party.location_address) && (
              <Fact emoji="📍">
                {party.location_name && <span className="font-semibold">{party.location_name}</span>}
                {party.location_name && party.location_address && <br />}
                {party.location_address && <span className="pp-muted">{party.location_address}</span>}
                {mapHref && (
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 font-semibold underline-offset-4 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Map →
                  </a>
                )}
              </Fact>
            )}
            {party.rsvp_deadline && (
              <Fact emoji="⏰">RSVP by <span className="font-semibold">{formatPartyDate(party.rsvp_deadline)}</span></Fact>
            )}
            {party.gift_note && <Fact emoji="🎁">{party.gift_note}</Fact>}
            {party.food_note && <Fact emoji="🍕">{party.food_note}</Fact>}
            {party.rain_plan && <Fact emoji="☔">{party.rain_plan}</Fact>}
            {party.host_name && (
              <Fact emoji="💌">
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
              </Fact>
            )}
          </div>
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
          <div className="mt-5 flex flex-wrap gap-2">
            <CalendarAddButton slug={slug} party={party} />
          </div>
        </section>

        <section id="rsvp" className="pp-enter mt-6 pp-card px-6 py-7 sm:px-8 sm:py-8" style={{ animationDelay: "0.16s" }}>
          <RsvpForm
            slug={slug}
            scriptUrl={scriptUrl}
            isDemo={isDemo}
            inviteToken={inviteToken}
          />
        </section>

        {party.profile_image_url && (
          <div className="pp-enter mt-6 flex items-center gap-5 pp-card px-6 py-5" style={{ animationDelay: "0.24s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={party.profile_image_url}
              alt={party.birthday_child_name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
            />
            <div className="text-xl font-semibold">{party.birthday_child_name} 🎂</div>
          </div>
        )}

        <section className="pp-enter mt-8" style={{ animationDelay: "0.32s" }}>
          <h2 className="mb-3 text-xl font-bold tracking-tight">💌 Wishes</h2>
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
          🔒 Unlisted · link only
        </footer>

        <StickyRsvpBar visible={scrolled} />
      </main>
    </>
  );
}

function Fact({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="text-xl leading-6">{emoji}</span>
      <div className="min-w-0 leading-6">{children}</div>
    </div>
  );
}
