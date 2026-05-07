"use client";

export function StickyRsvpBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 px-4 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <a
        href="#rsvp"
        className="block rounded-2xl px-5 py-3 text-center text-base font-semibold text-white shadow-lg"
        style={{ background: "var(--accent)" }}
      >
        RSVP
      </a>
    </div>
  );
}
