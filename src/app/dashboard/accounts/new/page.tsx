import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewAccountForm } from "./form";

export const metadata: Metadata = { title: "Add account" };

export default function NewAccountPage() {
  return (
    <>
      <PageHeader
        title="Add an account"
        description="Run several niche accounts? Each gets its own page and numbers. Totals combine on Overview."
      />
      <NewAccountForm />
    </>
  );
}
