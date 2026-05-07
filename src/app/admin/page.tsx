import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPartyDateLong } from "@/lib/format";

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: parties } = await supabase
    .from("parties")
    .select("id, slug, party_title, birthday_child_name, birthday_age, date, is_published, hero_image_url")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your parties</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create a new party page or pick one to manage.
          </p>
        </div>
        <Link
          href="/admin/party/new"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-zinc-800"
        >
          + New party
        </Link>
      </div>

      {parties && parties.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {parties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/party/${p.id}`}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 hover:shadow-md"
              >
                <div
                  className="h-32 w-full bg-gradient-to-br from-pink-100 via-amber-100 to-sky-100"
                  style={
                    p.hero_image_url
                      ? { backgroundImage: `url(${p.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{p.party_title}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {p.birthday_child_name}
                    {p.birthday_age ? ` · turning ${p.birthday_age}` : ""}
                    {p.date ? ` · ${formatPartyDateLong(p.date)}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <div className="text-4xl">🎈</div>
          <p className="mt-3 text-zinc-700">No parties yet.</p>
          <Link
            href="/admin/party/new"
            className="mt-4 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
          >
            Create your first party
          </Link>
        </div>
      )}
    </div>
  );
}
