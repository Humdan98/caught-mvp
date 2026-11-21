"use client";

import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { signup, type AuthState } from "../actions";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {});
  const [handle, setHandle] = useState(state.values?.handle ?? "");
  const e = state.errors ?? {};
  const clean = handle.trim().toLowerCase().replace(/^@/, "");

  return (
    <ActionForm dispatch={action} pending={pending} className="space-y-4" noValidate>
      <FormError message={e.form} />
      <Field
        label="Handle"
        htmlFor="handle"
        error={e.handle}
        hint={<span className="num">caughtshop.com/{clean || "yourname"}</span>}
      >
        <div className="relative">
          <span className="num pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">@</span>
          <Input
            id="handle"
            name="handle"
            value={handle}
            onChange={(ev) => setHandle(ev.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourtiktokname"
            className="pl-7"
            aria-invalid={!!e.handle}
            required
          />
        </div>
      </Field>
      <Field label="Display name" htmlFor="displayName" error={e.displayName}>
        <Input id="displayName" name="displayName" defaultValue={state.values?.displayName} placeholder="Maya Reyes" aria-invalid={!!e.displayName} required />
      </Field>
      <Field label="Email" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!e.email} required />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} required />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Creating…">
        Claim @{clean || "handle"}
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </ActionForm>
  );
}
