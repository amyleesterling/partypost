"use client";

import { useEffect, useState } from "react";

export function ThanksCopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(path);

  useEffect(() => {
    setFullUrl(window.location.origin + path);
  }, [path]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <code className="mt-3 block break-all rounded-lg bg-zinc-100 p-2 text-xs">
        {fullUrl}
      </code>
      <button
        type="button"
        onClick={copy}
        className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-white"
        style={{ background: "var(--accent)" }}
      >
        {copied ? "Copied!" : "Copy edit link"}
      </button>
    </>
  );
}
