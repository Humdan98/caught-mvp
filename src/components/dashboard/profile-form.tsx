"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Plus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { updateProfile } from "@/app/dashboard/_actions/account";
import type { FormState } from "@/app/dashboard/_actions/result";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { SOCIAL_LABEL, SOCIAL_PLATFORMS } from "@/lib/constants";
import { ImageField } from "./image-field";

type Social = { key: number; platform: string; url: string };

export function ProfileForm({
  initial,
}: {
  initial: { displayName: string; handle: string; bio: string; avatarUrl: string | null; socials: { platform: string; url: string }[] };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const [socials, setSocials] = useState<Social[]>(initial.socials.map((s, i) => ({ ...s, key: i })));
  const [handle, setHandle] = useState(initial.handle);
  const e = state.errors ?? {};
  const handleChanged = handle.trim().toLowerCase().replace(/^@/, "") !== initial.handle;

  return (
    <ActionForm dispatch={action} pending={pending} className="max-w-2xl space-y-5" noValidate>
      <FormError message={state.ok ? undefined : state.message} />
      {state.ok && (
        <p role="status" className="rounded-lg border border-ink/15 bg-sheet px-3 py-2 text-sm">
          Saved. Your page is updated.
        </p>
      )}
      <section className="sheet space-y-5 p-5">
        <ImageField name="avatar" label="Profile photo" defaultUrl={initial.avatarUrl} error={e.avatarUrl} aspect="round" />
        <Field label="Display name" htmlFor="displayName" error={e.displayName}>
          <Input id="displayName" name="displayName" defaultValue={initial.displayName} aria-invalid={!!e.displayName} required />
        </Field>
        <Field
          label="Handle"
          htmlFor="handle"
          error={e.handle}
          hint={
            handleChanged ? (
              <span className="text-danger">Changing your handle breaks the link already in your TikTok bio.</span>
            ) : (
              <span className="num">caughtshop.com/{initial.handle}</span>
            )
          }
        >
          <Input id="handle" name="handle" value={handle} onChange={(ev) => setHandle(ev.target.value)} autoCapitalize="none" spellCheck={false} className="num" aria-invalid={!!e.handle} />
        </Field>
        <Field label="Bio" htmlFor="bio" error={e.bio} hint="Up to 280 characters.">
          <Textarea id="bio" name="bio" defaultValue={initial.bio} maxLength={280} rows={3} />
        </Field>
      </section>

      <section className="sheet space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Other socials</h2>
          <p className="text-[13px] text-muted">Shown as links under your name.</p>
        </div>
        {socials.map((s, i) => (
          <div key={s.key} className="flex gap-2">
            <div className="w-32 shrink-0 sm:w-40">
            <Select
              name="socialPlatform"
              value={s.platform}
              onChange={(ev) => setSocials((all) => all.map((x) => (x.key === s.key ? { ...x, platform: ev.target.value } : x)))}
              aria-label="Platform"
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {SOCIAL_LABEL[p]}
                </option>
              ))}
            </Select>
            </div>
            <Input
              name="socialUrl"
              type="url"
              value={s.url}
              onChange={(ev) => setSocials((all) => all.map((x) => (x.key === s.key ? { ...x, url: ev.target.value } : x)))}
              placeholder="https://…"
              className="min-w-0"
              aria-label="Link"
              aria-invalid={!!e[`socials.${i}.url`]}
            />
            <button
              type="button"
              onClick={() => setSocials((all) => all.filter((x) => x.key !== s.key))}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-ink/5"
              aria-label="Remove link"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {Object.entries(e)
          .filter(([k]) => k.startsWith("socials"))
          .slice(0, 1)
          .map(([k, msg]) => (
            <p key={k} className="text-[13px] text-danger" role="alert">
              Link {Number(k.split(".")[1]) + 1}: {msg}
            </p>
          ))}
        {socials.length < 8 && (
          <button
            type="button"
            onClick={() => setSocials((all) => [...all, { key: Date.now(), platform: "instagram", url: "" }])}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-ink/25 px-3 text-[13px] hover:border-ink/50"
          >
            <Plus className="size-3.5" /> Add link
          </button>
        )}
      </section>
      <SubmitButton size="lg" pendingText="Saving…">
        Save profile
      </SubmitButton>
    </ActionForm>
  );
}
