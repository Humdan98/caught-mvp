"use client";

import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { login, type AuthState } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});
  const e = state.errors ?? {};
  return (
    <ActionForm dispatch={action} pending={pending} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError message={e.form} />
      <Field label="Email" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!e.email} required />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={!!e.password} required />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Logging in…">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        New to Caught?{" "}
        <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
          Claim your handle
        </Link>
      </p>
    </ActionForm>
  );
}
