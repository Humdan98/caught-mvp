"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";

// A valid scrypt hash of a random string, used when the email doesn't exist.
const DUMMY_HASH =
  "scrypt$5f6b2c1d9e8a7b6c5d4e3f2a1b0c9d8e$" + "0".repeat(128);

export type AuthState = { errors?: Record<string, string>; values?: Record<string, string> };

export async function signup(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
    handle: String(form.get("handle") ?? ""),
    displayName: String(form.get("displayName") ?? ""),
  };
  const parsed = signupSchema.safeParse(values);
  const echo = { ...values, password: "" };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo };
  const { email, password, handle, displayName } = parsed.data;

  const [emailTaken, handleTaken] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.creator.findUnique({ where: { handle }, select: { id: true } }),
  ]);
  if (emailTaken || handleTaken) {
    return {
      errors: {
        ...(emailTaken && { email: "An account with this email exists. Log in instead." }),
        ...(handleTaken && { handle: `@${handle} is taken` }),
      },
      values: echo,
    };
  }

  let creatorId: string;
  try {
    const user = await db.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        creators: { create: { handle, displayName } },
      },
      include: { creators: { select: { id: true } } },
    });
    creatorId = user.creators[0].id;
    await createSession(user.id, creatorId);
  } catch (err) {
    console.error("signup failed", err);
    // Most likely a race on the unique handle/email.
    return { errors: { form: "Couldn't create the account. Try a different handle." }, values: echo };
  }
  redirect("/dashboard/products?welcome=1");
}

export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: values.email } };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Always run scrypt so response time doesn't reveal whether the email has an account.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return { errors: { form: "Email or password is wrong." }, values: { email: values.email } };
  }
  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
