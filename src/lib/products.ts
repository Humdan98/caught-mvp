import { MAX_BACKUP_HOPS } from "./constants";

type Fallbackable = { id: string; status: string; isVisible: boolean; backupProductId: string | null };

/**
 * For a sold-out product, follow backup links until we find something buyable.
 * Stops on cycles, hidden products, or after MAX_BACKUP_HOPS.
 */
export function resolveBackup<T extends Fallbackable>(product: T, byId: Map<string, T>): T | null {
  const seen = new Set([product.id]);
  let current: T | undefined = product;
  for (let hop = 0; hop < MAX_BACKUP_HOPS; hop++) {
    const nextId: string | null = current.backupProductId;
    if (!nextId || seen.has(nextId)) return null;
    seen.add(nextId);
    const next = byId.get(nextId);
    if (!next || !next.isVisible) return null;
    if (next.status === "AVAILABLE") return next;
    current = next;
  }
  return null;
}
