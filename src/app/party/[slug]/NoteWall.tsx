"use client";

import { useState } from "react";
import { submitNote, type PublicNote } from "@/lib/sheets";

export function NoteWall({
  scriptUrl,
  notes,
}: {
  scriptUrl: string;
  notes: PublicNote[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !message.trim()) {
      setError("Please add a name and message.");
      return;
    }
    setSubmitting(true);
    try {
      await submitNote(scriptUrl, { display_name: name, message });
      setSubmitted(true);
      setName("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post note.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm pp-muted">
          {notes.length === 0
            ? "Be the first to leave a wish."
            : `${notes.length} wish${notes.length === 1 ? "" : "es"}`}
        </p>
        {!showForm && !submitted && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "white", borderRadius: "var(--button-radius)" }}
          >
            Leave a wish
          </button>
        )}
      </div>

      {submitted && (
        <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          Thanks! Your note is waiting for host approval.
        </div>
      )}

      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="mb-5 pp-card p-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="pp-input"
            disabled={submitting}
          />
          <textarea
            placeholder="Happy birthday! …"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="pp-textarea mt-2"
            disabled={submitting}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {submitting ? "Posting…" : "Post wish"}
            </button>
          </div>
        </form>
      )}

      {notes.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id} className="pp-card p-4">
              <div className="text-sm font-semibold">{n.display_name}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        !showForm && (
          <div className="pp-card p-6 text-center text-sm pp-muted">
            No wishes yet. Tap &quot;Leave a wish&quot; to be first!
          </div>
        )
      )}
    </div>
  );
}
