import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import {
  HouseIcon,
  UsersIcon,
  BriefcaseIcon,
  ChatCircleIcon
} from "@phosphor-icons/react";

const NAV_LINKS = [
  { to: "/home", label: "Home", icon: HouseIcon },
  { to: "/crew", label: "Directory", icon: UsersIcon },
  { to: "/jobs", label: "Jobs", icon: BriefcaseIcon },
] as const;


export function NavLinks({ session }: { session: unknown }) {
  const { pathname } = useLocation();
  const unreadCount = useUnreadCount();
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);

  const allLinks = [
    ...NAV_LINKS,
    ...(session ? [{ to: "/inbox" as const, label: "Inbox" as const, icon: ChatCircleIcon }] : []),
  ];

  useEffect(() => {
    function updateIndicator() {
      const active = allLinks.find((link) => pathname === link.to);
      if (!active || !containerRef.current) {
        setHasInitialized(false);
        return;
      }

      const linkEl = linkRefs.current.get(active.to);
      if (!linkEl) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();

      setIndicator({
        left: linkRect.left - containerRect.left,
        width: linkRect.width,
      });
      setHasInitialized(true);
    }

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, !!session]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {hasInitialized && (
        <div
          className="absolute -bottom-2.75 h-0.5 rounded-full bg-foreground transition-all duration-300 ease-in-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {allLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          ref={(el) => {
            if (el) linkRefs.current.set(link.to, el);
          }}
          className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            pathname === link.to
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <link.icon size={18} />
          <span className="hidden md:inline">{link.label}</span>
          {link.to === "/inbox" && unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}