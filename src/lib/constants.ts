export const DESTINATIONS = ["TIKTOK", "AMAZON", "BRAND"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const DESTINATION_LABEL: Record<Destination, string> = {
  TIKTOK: "TikTok Shop",
  AMAZON: "Amazon",
  BRAND: "Brand site",
};

export const CLICK_SOURCES = ["search", "video", "grid", "backup", "direct"] as const;
export type ClickSource = (typeof CLICK_SOURCES)[number];

export const SOURCE_LABEL: Record<ClickSource, string> = {
  search: "Search",
  video: "Video grid",
  grid: "Product grid",
  backup: "Sold-out backup",
  direct: "Direct link",
};

export const PRODUCT_STATUSES = ["AVAILABLE", "SOLD_OUT"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const SOCIAL_PLATFORMS = ["tiktok", "instagram", "youtube", "x", "amazon", "website"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  amazon: "Amazon storefront",
  website: "Website",
};

// Handles that would collide with app routes.
export const RESERVED_HANDLES = new Set([
  "api", "app", "admin", "dashboard", "login", "logout", "signup", "register", "settings",
  "go", "media", "receipt", "sandbox", "static", "public", "help", "support", "about",
  "terms", "privacy", "caught", "www", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
]);

export const SANDBOX_MODE = process.env.CAUGHT_SANDBOX !== "false";

/** How far the sold-out fallback will follow backup → backup chains. */
export const MAX_BACKUP_HOPS = 3;
