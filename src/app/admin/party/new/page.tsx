import { NewPartyForm } from "./NewPartyForm";

export default function NewPartyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Create a party</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Just a few details to start. You can edit anything later.
      </p>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <NewPartyForm />
      </div>
    </div>
  );
}
