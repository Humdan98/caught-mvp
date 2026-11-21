import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSession()) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Your products, your numbers, your sales.</p>
      <LoginForm next={next} />
      <div className="sheet mt-8 px-4 py-3 text-[13px]">
        <p className="label mb-1">Demo account</p>
        <p className="num">demo@caughtshop.com</p>
        <p className="num">caught-demo</p>
      </div>
    </>
  );
}
