"use client";

import { ActionForm } from "@/components/ui/action-form";
import { useActionState } from "react";
import { createCreatorAccount } from "@/app/dashboard/_actions/account";
import type { FormState } from "@/app/dashboard/_actions/result";
import { Field, FormError, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCreatorAccount, {});
  const e = state.errors ?? {};
  return (
    <ActionForm dispatch={action} pending={pending} className="sheet max-w-md space-y-4 p-5" noValidate>
      <FormError message={state.message} />
      <Field label="Handle" htmlFor="handle" error={e.handle} hint="The TikTok account this page is for.">
        <Input id="handle" name="handle" autoCapitalize="none" spellCheck={false} placeholder="yourkitchenacct" className="num" aria-invalid={!!e.handle} />
      </Field>
      <Field label="Display name" htmlFor="displayName" error={e.displayName}>
        <Input id="displayName" name="displayName" aria-invalid={!!e.displayName} />
      </Field>
      <SubmitButton pendingText="Creating…">Create account</SubmitButton>
    </ActionForm>
  );
}
