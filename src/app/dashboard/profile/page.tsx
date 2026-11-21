import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { CopyButton } from "@/components/ui/copy-button";
import { requireCreator } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { creator } = await requireCreator();
  const full = await db.creator.findUniqueOrThrow({
    where: { id: creator.id },
    include: { socials: { orderBy: { sortOrder: "asc" } } },
  });
  return (
    <>
      <PageHeader
        title="Profile"
        description={<span className="num">caughtshop.com/{full.handle}</span>}
        actions={<CopyButton value={`/${full.handle}`} label="Copy link" />}
      />
      <ProfileForm
        key={full.handle}
        initial={{
          displayName: full.displayName,
          handle: full.handle,
          bio: full.bio,
          avatarUrl: full.avatarUrl,
          socials: full.socials.map((s) => ({ platform: s.platform, url: s.url })),
        }}
      />
    </>
  );
}
