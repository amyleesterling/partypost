import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTheme, themeCssVars } from "@/lib/themes";
import { ThanksView } from "./ThanksView";
import { ThanksCopyButton } from "./ThanksCopyButton";

type Params = { slug: string };
type SearchParams = Promise<{ t?: string }>;

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { t: token } = await searchParams;
  const supabase = await createClient();
  const { data: party } = await supabase
    .from("parties")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!party || !party.is_published) notFound();

  const theme = getTheme(party.theme);
  const editPath = token ? `/party/${slug}/rsvp/edit/${token}` : null;

  return (
    <div className="themed" style={themeCssVars(theme)}>
      <main className="mx-auto max-w-xl px-4 pt-10 pb-16 sm:px-6">
        <div className="pp-card px-6 py-8 text-center">
          <div className="text-5xl">{theme.emoji}</div>
          <h1 className="mt-4 text-3xl font-bold">Yay! Your RSVP is in.</h1>
          <p className="mt-2 text-base pp-muted">
            The snack-counting fairies have been notified.
          </p>

          {editPath && (
            <div className="mt-6 rounded-2xl bg-white/70 p-4 text-left">
              <div className="text-sm font-semibold">Need to change something?</div>
              <p className="mt-1 text-sm pp-muted">
                Save this magic link — it lets you update your RSVP later without making an account.
              </p>
              <code className="mt-3 block break-all rounded-lg bg-zinc-100 p-2 text-xs">
                {editPath}
              </code>
              <ThanksCopyButton path={editPath} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={`/party/${slug}`}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Back to party
            </Link>
          </div>
        </div>
      </main>
      <ThanksView />
    </div>
  );
}
