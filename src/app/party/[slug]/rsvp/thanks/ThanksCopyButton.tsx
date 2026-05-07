"use client";

import { useState } from "react";

export function ThanksCopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const url = window.location.origin + path;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-white"
      style={{ background: "var(--accent)" }}
    >
      {copied ? "Copied!" : "Copy edit link"}
    </button>
  );
}
