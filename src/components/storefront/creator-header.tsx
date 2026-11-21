import { ArrowUpRight } from "lucide-react";
import { SOCIAL_LABEL, type SocialPlatform } from "@/lib/constants";

type Props = {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  socials: { id: string; platform: string; url: string }[];
};

export function CreatorHeader({ displayName, handle, bio, avatarUrl, socials }: Props) {
  return (
    <header className="px-5 pt-8 pb-5">
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-full border border-line bg-paper-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-xl font-semibold text-muted">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{displayName}</h1>
          <p className="num text-sm text-muted">@{handle}</p>
        </div>
      </div>
      {bio && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{bio}</p>}
      {socials.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {socials.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 rounded-full border border-ink/15 px-3 text-[13px] text-ink-2 transition-colors hover:border-ink/40"
              >
                {SOCIAL_LABEL[s.platform as SocialPlatform] ?? s.platform}
                <ArrowUpRight className="size-3 opacity-50" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
