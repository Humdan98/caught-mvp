/**
 * Demo data: one login that owns two creator accounts, with 90 days of
 * realistic, internally consistent events (visits → clicks → sales).
 * Safe to re-run: the demo user is deleted and recreated.
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

export const DEMO_EMAIL = "demo@caughtshop.com";
export const DEMO_PASSWORD = "caught-demo";

// Deterministic PRNG so every reviewer sees the same numbers.
let seed = 47;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    if ((r -= w) <= 0) return item;
  }
  return items[items.length - 1][0];
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
/** A random moment on `daysAgo`, skewed toward evening (when TikTok traffic peaks). */
function momentOn(daysAgo: number) {
  const hour = weighted([[9, 1], [12, 2], [15, 2], [18, 3], [20, 4], [22, 3], [23, 1]] as [number, number][]);
  const d = new Date(now - daysAgo * DAY);
  d.setHours(hour, Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
  return d.getTime() > now ? new Date(now - rand() * 3600_000) : d;
}

const img = (name: string) => `/demo/p-${name}.svg`;
const thumb = (name: string) => `/demo/${name}.svg`;
const tiktokShop = (id: string) => `https://shop.tiktok.com/view/product/17${id}?region=US&locale=en`;
const amazon = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=mayafinds-20`;

type SeedProduct = {
  key: string;
  number: number;
  name: string;
  description: string;
  price: number;
  image: string;
  tiktok: string;
  amazon?: string;
  brand?: string;
  commission: number; // percent
  soldOut?: boolean;
  backup?: string; // key
  hidden?: boolean;
  popularity: number; // relative click weight for generated events
};

const MAYA_PRODUCTS: SeedProduct[] = [
  {
    key: "lipoil", number: 47, name: "Tinted Lip Oil — Cherry", price: 14,
    description: "Glossy, not sticky. Sheer cherry tint that builds. The one from the car video.",
    image: img("lip-oil"), tiktok: tiktokShop("29384710047"), amazon: amazon("B0CHRYLIP7"),
    brand: "https://example-brand.com/products/cherry-lip-oil", commission: 20, popularity: 30,
  },
  {
    key: "serum", number: 44, name: "Vitamin C 15% Face Serum", price: 29,
    description: "15% L-ascorbic acid with ferulic + vitamin E. Use mornings, under sunscreen. Took about 4 weeks to see a difference.",
    image: img("vitamin-c-serum"), tiktok: tiktokShop("29384710044"), amazon: amazon("B0VITC15SR"),
    brand: "https://example-brand.com/products/vitamin-c-serum", commission: 15, popularity: 18,
  },
  {
    key: "sunscreen", number: 43, name: "Mineral Sunscreen SPF 50", price: 22,
    description: "Zinc only, no white cast on me. Wears well under makeup.",
    image: img("sunscreen"), tiktok: tiktokShop("29384710043"), amazon: amazon("B0SPF50MIN"),
    commission: 12, popularity: 14,
  },
  {
    key: "moisturizer", number: 41, name: "Barrier Repair Moisturizer", price: 24,
    description: "Ceramides + squalane. What fixed my over-exfoliated skin. Fragrance free.",
    image: img("moisturizer"), tiktok: tiktokShop("29384710041"), amazon: amazon("B0BARRIER1"),
    brand: "https://example-brand.com/products/barrier-cream", commission: 15, popularity: 12,
  },
  {
    key: "peptide", number: 42, name: "Peptide Lip Treatment — Vanilla", price: 16,
    description: "Overnight lip mask. Sold out everywhere right now.",
    image: img("peptide-lip"), tiktok: tiktokShop("29384710042"), commission: 18,
    soldOut: true, backup: "lipoil", popularity: 10,
  },
  {
    key: "pillow", number: 45, name: "Mulberry Silk Pillowcase — Champagne", price: 34,
    description: "22 momme, zip closure. Less frizz, fewer creases. Champagne is sold out.",
    image: img("silk-pillowcase"), tiktok: tiktokShop("29384710045"), amazon: amazon("B0SILKCHMP"),
    commission: 10, soldOut: true, backup: "scrunchies", popularity: 9,
  },
  {
    key: "scrunchies", number: 46, name: "Satin Sleep Scrunchies (6-pack)", price: 12,
    description: "No dents, no breakage. Six colors.",
    image: img("scrunchies"), tiktok: tiktokShop("29384710046"), amazon: amazon("B0SCRUNCH6"),
    commission: 15, popularity: 7,
  },
  {
    key: "guasha", number: 48, name: "Rose Quartz Gua Sha", price: 19,
    description: "Two minutes in the morning with a face oil. Keep it in the fridge.",
    image: img("gua-sha"), tiktok: tiktokShop("29384710048"), amazon: amazon("B0GUASHA48"),
    brand: "https://example-brand.com/products/gua-sha", commission: 20, popularity: 8,
  },
  {
    key: "curler", number: 49, name: "Heatless Curling Rod Set", price: 21,
    description: "Satin rod + 2 scrunchies + clip. Sleep in it, curls last two days.",
    image: img("curling-rod"), tiktok: tiktokShop("29384710049"), amazon: amazon("B0CURLROD9"),
    commission: 15, popularity: 11,
  },
  {
    key: "mirror", number: 50, name: "LED Makeup Mirror (3 light modes)", price: 39,
    description: "Rechargeable, dimmable, 10x spot mirror included.",
    image: img("led-mirror"), tiktok: tiktokShop("29384710050"), amazon: amazon("B0LEDMIR50"),
    brand: "https://example-brand.com/products/led-mirror", commission: 10, popularity: 6,
  },
  {
    key: "patches", number: 51, name: "Hydrocolloid Pimple Patches (72 ct)", price: 11,
    description: "Two sizes. Flattens a whitehead overnight.",
    image: img("pimple-patches"), tiktok: tiktokShop("29384710051"), amazon: amazon("B0PATCH72C"),
    commission: 15, popularity: 9,
  },
  {
    key: "toner", number: 40, name: "Glass Skin Rice Toner", price: 18,
    description: "Milky, hydrating, gentle enough for daily use.",
    image: img("rice-toner"), tiktok: tiktokShop("29384710040"), amazon: amazon("B0RICETON4"),
    commission: 15, popularity: 7,
  },
  {
    key: "hairmask", number: 39, name: "Bond Repair Hair Mask (old collab)", price: 26,
    description: "Collab ended. Hidden from the page.",
    image: img("hair-mask"), tiktok: tiktokShop("29384710039"), commission: 10, hidden: true, popularity: 0,
  },
];

const KITCHEN_PRODUCTS: SeedProduct[] = [
  {
    key: "chopper", number: 1, name: "Mini Electric Chopper", price: 25,
    description: "Cordless, USB-C. Garlic, salsa, baby food.",
    image: img("mini-chopper"), tiktok: tiktokShop("39384710001"), amazon: amazon("B0CHOPMINI"),
    commission: 15, popularity: 10,
  },
  {
    key: "sprayer", number: 2, name: "Glass Oil Sprayer", price: 13,
    description: "Mist, not stream. Air fryer essential.",
    image: img("oil-sprayer"), tiktok: tiktokShop("39384710002"), amazon: amazon("B0OILSPRAY"),
    commission: 18, popularity: 8,
  },
  {
    key: "lids", number: 3, name: "Silicone Stretch Lids (3 sizes)", price: 15,
    description: "Replaces cling film. Dishwasher safe.",
    image: img("silicone-lids"), tiktok: tiktokShop("39384710003"), commission: 15, popularity: 4,
  },
  {
    key: "knife", number: 4, name: "Magnetic Knife Strip", price: 29,
    description: "Acacia wood, holds 6 knives, no drilling kit included.",
    image: img("knife-strip"), tiktok: tiktokShop("39384710004"), amazon: amazon("B0KNIFESTR"),
    brand: "https://example-brand.com/products/knife-strip", commission: 12, popularity: 5,
  },
];

const MAYA_VIDEOS = [
  { key: "v1", product: "lipoil", caption: "the $14 lip oil everyone keeps asking about 🍒 it's #47" },
  { key: "v2", product: "serum", caption: "day 30 of vitamin c — before/after, no filter" },
  { key: "v3", product: "sunscreen", caption: "a mineral sunscreen with NO white cast?? finally" },
  { key: "v4", product: "moisturizer", caption: "how I fixed my destroyed skin barrier (cheap)" },
  { key: "v5", product: "peptide", caption: "overnight lip routine ✨ (yes it sold out)" },
  { key: "v6", product: "pillow", caption: "silk pillowcase hair test: 7 nights" },
  { key: "v7", product: "guasha", caption: "2 minute morning depuff" },
  { key: "v8", product: "curler", caption: "heatless curls that actually hold all day" },
  { key: "v9", product: "mirror", caption: "vanity glow up under $40" },
  { key: "v10", product: "patches", caption: "the patch that flattened it overnight" },
  { key: "v11", product: "lipoil", caption: "cherry lip oil swatch on 3 skin tones" },
  { key: "v12", product: null, caption: "grwm for a wedding (no links, just chatting)" },
];

const KITCHEN_VIDEOS = [
  { key: "k1", product: "chopper", caption: "salsa in 10 seconds, no cleanup" },
  { key: "k2", product: "sprayer", caption: "the air fryer accessory you actually need" },
  { key: "k3", product: "knife", caption: "tiny kitchen hack: get knives off the counter" },
];

const NO_RESULT_QUERIES: [string, number][] = [
  ["hair oil", 9], ["retinol", 7], ["#53", 6], ["lip liner", 5], ["#38", 5],
  ["eye patches", 4], ["toner pads", 3], ["led mask", 3], ["dupe", 2], ["claw clip", 2],
];

async function createCreator(opts: {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  socials: { platform: string; url: string }[];
  products: SeedProduct[];
  videos: { key: string; product: string | null; caption: string }[];
  dailyVisits: (daysAgo: number) => number;
  noResultQueries: [string, number][];
}) {
  const nextNumber = Math.max(...opts.products.map((p) => p.number)) + 1;
  const creator = await db.creator.create({
    data: {
      userId: opts.userId,
      handle: opts.handle,
      displayName: opts.displayName,
      bio: opts.bio,
      avatarUrl: opts.avatarUrl,
      nextProductNumber: nextNumber,
      createdAt: new Date(now - 120 * DAY),
      socials: { create: opts.socials.map((s, i) => ({ ...s, sortOrder: i })) },
    },
  });

  // Products (backups wired up in a second pass).
  const productIds = new Map<string, string>();
  const ordered = [...opts.products].sort((a, b) => b.popularity - a.popularity);
  for (const [i, p] of ordered.entries()) {
    const row = await db.product.create({
      data: {
        creatorId: creator.id,
        number: p.number,
        name: p.name,
        description: p.description,
        priceCents: p.price * 100,
        imageUrl: p.image,
        tiktokUrl: p.tiktok,
        amazonUrl: p.amazon ?? null,
        brandUrl: p.brand ?? null,
        commissionBps: p.commission * 100,
        status: p.soldOut ? "SOLD_OUT" : "AVAILABLE",
        isVisible: !p.hidden,
        sortOrder: i,
        createdAt: new Date(now - (90 - (p.number % 30)) * DAY),
      },
    });
    productIds.set(p.key, row.id);
  }
  for (const p of opts.products.filter((x) => x.backup)) {
    await db.product.update({
      where: { id: productIds.get(p.key)! },
      data: { backupProductId: productIds.get(p.backup!)! },
    });
  }

  const videoIds = new Map<string, string>(); // product key → a video id
  for (const [i, v] of opts.videos.entries()) {
    const row = await db.video.create({
      data: {
        creatorId: creator.id,
        productId: v.product ? productIds.get(v.product)! : null,
        tiktokUrl: `https://www.tiktok.com/@${opts.handle}/video/74${String(1e15 + i * 7919).slice(0, 15)}`,
        thumbnailUrl: thumb(v.key),
        caption: v.caption,
        sortOrder: i,
        createdAt: new Date(now - (60 - i * 4) * DAY),
      },
    });
    if (v.product && !videoIds.has(v.product)) videoIds.set(v.product, row.id);
  }

  // ---- Events: 90 days of visits → clicks → sales -----------------------------------
  const clickable = opts.products.filter((p) => !p.hidden);
  const pageViews: { creatorId: string; device: string; referrer: string | null; createdAt: Date }[] = [];
  const clicks: {
    id: string; creatorId: string; productId: string; videoId: string | null; productNumber: number;
    productName: string; destination: string; source: string; createdAt: Date;
  }[] = [];
  const searches: { creatorId: string; query: string; resultCount: number; createdAt: Date }[] = [];
  let clickSeq = 0;

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const visits = opts.dailyVisits(daysAgo);
    for (let v = 0; v < visits; v++) {
      const createdAt = momentOn(daysAgo);
      pageViews.push({
        creatorId: creator.id,
        device: rand() < 0.93 ? "mobile" : "desktop",
        referrer: weighted([["www.tiktok.com", 70], [null, 22], ["www.instagram.com", 8]] as [string | null, number][]),
        createdAt,
      });

      if (rand() < 0.34) {
        // Viewer typed something. Mostly a number that exists.
        const p = weighted(clickable.map((x) => [x, x.popularity] as [SeedProduct, number]));
        const q = rand() < 0.7 ? String(p.number) : rand() < 0.5 ? `#${p.number}` : p.name.split(" ")[0].toLowerCase();
        searches.push({ creatorId: creator.id, query: q, resultCount: 1, createdAt });
      }
      if (rand() < 0.035 && opts.noResultQueries.length) {
        const q = weighted(opts.noResultQueries);
        searches.push({ creatorId: creator.id, query: q, resultCount: 0, createdAt });
      }

      if (rand() < 0.27) {
        // Sold-out products send their traffic to the backup.
        let p = weighted(clickable.map((x) => [x, x.popularity] as [SeedProduct, number]));
        let source = weighted([["search", 44], ["video", 30], ["grid", 18], ["direct", 8]] as [string, number][]);
        if (p.soldOut && p.backup) {
          p = clickable.find((x) => x.key === p.backup)!;
          source = "backup";
        }
        const destination = weighted(
          [
            ["TIKTOK", 66],
            ["AMAZON", p.amazon ? 24 : 0],
            ["BRAND", p.brand ? 10 : 0],
          ] as [string, number][],
        );
        clicks.push({
          id: `seedclick_${opts.handle}_${clickSeq++}`,
          creatorId: creator.id,
          productId: productIds.get(p.key)!,
          videoId: source === "video" ? (videoIds.get(p.key) ?? null) : null,
          productNumber: p.number,
          productName: p.name,
          destination,
          source: source === "video" && !videoIds.get(p.key) ? "grid" : source,
          createdAt: new Date(createdAt.getTime() + 20_000 + rand() * 60_000),
        });
      }
    }
  }

  await db.pageView.createMany({ data: pageViews });
  await db.searchEvent.createMany({ data: searches });
  await db.clickEvent.createMany({ data: clicks });

  // ~7% of clicks convert; Amazon converts a bit better (Prime trust).
  const byKey = new Map(opts.products.map((p) => [productIds.get(p.key)!, p]));
  const sales = clicks
    .filter((c) => rand() < (c.destination === "AMAZON" ? 0.09 : 0.065))
    .map((c) => {
      const p = byKey.get(c.productId)!;
      const qty = rand() < 0.12 ? 2 : 1;
      const amountCents = p.price * 100 * qty;
      return {
        creatorId: creator.id,
        productId: c.productId,
        clickId: c.id,
        productNumber: c.productNumber,
        productName: c.productName,
        destination: c.destination,
        amountCents,
        commissionCents: Math.round((amountCents * p.commission) / 100),
        createdAt: new Date(c.createdAt.getTime() + (5 + rand() * 40) * 60_000),
      };
    })
    .filter((s) => s.createdAt.getTime() < now);
  await db.sale.createMany({ data: sales });

  return { creator, productIds, counts: { pageViews: pageViews.length, clicks: clicks.length, sales: sales.length } };
}

async function main() {
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await db.user.create({
    data: { email: DEMO_EMAIL, passwordHash: await hashPassword(DEMO_PASSWORD), createdAt: new Date(now - 120 * DAY) },
  });

  // Traffic grows over the quarter, with a spike when the lip oil video took off ~3 weeks ago.
  const mayaVisits = (d: number) => {
    const base = 26 + (89 - d) * 0.55;
    const spike = d >= 18 && d <= 24 ? 70 * Math.exp(-Math.abs(d - 21) / 1.6) : 0;
    const weekend = [0, 6].includes(new Date(now - d * DAY).getDay()) ? 1.25 : 1;
    return Math.round((base + spike) * weekend * (0.8 + rand() * 0.4));
  };

  const maya = await createCreator({
    userId: user.id,
    handle: "mayafinds",
    displayName: "Maya Reyes",
    bio: "Skincare that works on real skin, and the hair stuff I actually use. Every product has a number — it's in the video.",
    avatarUrl: "/demo/avatar-maya.svg",
    socials: [
      { platform: "tiktok", url: "https://www.tiktok.com/@mayafinds" },
      { platform: "instagram", url: "https://www.instagram.com/mayafinds" },
      { platform: "amazon", url: "https://www.amazon.com/shop/mayafinds" },
      { platform: "youtube", url: "https://www.youtube.com/@mayafinds" },
    ],
    products: MAYA_PRODUCTS,
    videos: MAYA_VIDEOS,
    dailyVisits: mayaVisits,
    noResultQueries: NO_RESULT_QUERIES,
  });

  const kitchen = await createCreator({
    userId: user.id,
    handle: "mayakitchen",
    displayName: "Maya in the Kitchen",
    bio: "Small-kitchen gadgets that earn their counter space. Numbers in every video.",
    avatarUrl: "/demo/avatar-maya-kitchen.svg",
    socials: [{ platform: "tiktok", url: "https://www.tiktok.com/@mayakitchen" }],
    products: KITCHEN_PRODUCTS,
    videos: KITCHEN_VIDEOS,
    dailyVisits: (d) => Math.round((6 + (89 - d) * 0.12) * (0.7 + rand() * 0.6)),
    noResultQueries: [["air fryer liners", 4], ["#5", 3], ["garlic press", 2]],
  });

  // Viewers waiting on products: mostly the sold-out ones.
  const signupPlan: [string, number, string][] = [
    ["peptide", 23, "restock"],
    ["pillow", 14, "restock"],
    ["mirror", 6, "sale"],
    ["serum", 5, "sale"],
    ["lipoil", 3, "sale"],
  ];
  const firstNames = ["ava", "jess", "kayla", "bri", "maria", "tasha", "lena", "nora", "sam", "dani", "keisha", "rosa", "emily", "hana", "zoe"];
  let n = 0;
  for (const [key, count, reason] of signupPlan) {
    for (let i = 0; i < count; i++) {
      const isPhone = rand() < 0.55;
      const contact = isPhone
        ? `+1${Math.floor(2000000000 + rand() * 7999999999)}`
        : `${pick(firstNames)}.${pick(["m", "r", "k", "t"])}${100 + n}@example.com`;
      n++;
      await db.notificationSignup.create({
        data: {
          creatorId: maya.creator.id,
          productId: maya.productIds.get(key)!,
          contact,
          contactType: isPhone ? "phone" : "email",
          reason,
          createdAt: momentOn(Math.floor(rand() * (reason === "restock" ? 20 : 60))),
        },
      });
    }
  }
  await db.notificationSignup.create({
    data: {
      creatorId: kitchen.creator.id,
      productId: kitchen.productIds.get("chopper")!,
      contact: "+13105550142",
      contactType: "phone",
      reason: "sale",
      createdAt: momentOn(3),
    },
  });

  console.log("Seeded demo data:");
  console.log(`  login     ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  @mayafinds   ${JSON.stringify(maya.counts)}`);
  console.log(`  @mayakitchen ${JSON.stringify(kitchen.counts)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
