import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Claim your handle" };

export default async function SignupPage() {
  const session = await getSession();
  if (session && session.user.creators.length > 0) redirect("/dashboard");
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Claim your handle</h1>
      <p className="mt-1 mb-6 text-sm text-muted">One link for your bio. Every product gets a number.</p>
      <SignupForm />
    </>
  );
}
