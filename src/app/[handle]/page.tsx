import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorHeader } from "@/components/storefront/creator-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StorefrontView } from "@/components/storefront/storefront-view";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { getStorefront } from "@/lib/storefront";

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const store = await getStorefront(handle);
  if (!store) return { title: "Not found" };
  return {
    title: `${store.creator.displayName} (@${store.creator.handle})`,
    description: store.creator.bio || `Everything ${store.creator.displayName} shows on TikTok, by number.`,
  };
}

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { q } = await searchParams;
  const store = await getStorefront(handle);
  if (!store) notFound();
  const { creator, products, videos } = store;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper">
      <VisitTracker creatorId={creator.id} />
      <CreatorHeader
        displayName={creator.displayName}
        handle={creator.handle}
        bio={creator.bio}
        avatarUrl={creator.avatarUrl}
        socials={creator.socials}
      />
      <StorefrontView
        creatorId={creator.id}
        handle={creator.handle}
        displayName={creator.displayName}
        products={products}
        videos={videos}
        initialQuery={typeof q === "string" ? q.slice(0, 100) : ""}
      />
      <StoreFooter />
    </main>
  );
}
