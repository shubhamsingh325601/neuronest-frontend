"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Collapsible } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, findActiveLeaf, isNavParent, type NavBadgeKey, type NavLeaf, type NavParent } from "../navigation/nav-config";
import { isPathActive } from "../navigation/paths";
import { useAdminPathname } from "../navigation/use-admin-pathname";
import { useUiStore } from "../state/ui-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export type NavBadges = Partial<Record<NavBadgeKey, number>>;
type Variant = "desktop" | "drawer";

const NARROW_QUERY = "(max-width: 1023px)";
const subscribeNarrow = (onChange: () => void) => {
  const media = window.matchMedia(NARROW_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** True when the desktop sidebar is showing icons only (user collapsed it, or the tablet rail). */
function useIconOnly(variant: Variant) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW_QUERY).matches, () => false);
  return variant === "desktop" && (collapsed || narrow);
}

// Labels, badges and submenus are hidden by CSS (driven by `html[data-sidebar]` and the breakpoint), not by
// React state, so the server render and the pre-paint script agree and nothing flashes on reload.
const hideWhenIconOnly = (variant: Variant) => (variant === "desktop" ? "max-lg:hidden in-data-[sidebar=collapsed]:hidden" : "");

const itemBase =
  "group/item relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const itemActive = "bg-sidebar-accent text-sidebar-accent-foreground";
// Accent bar on the active item (the reference's left marker), in the brand colour.
const activeBar =
  "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary before:content-['']";

function Badge({ count, variant }: { count?: number; variant: Variant }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground",
        hideWhenIconOnly(variant),
      )}
    >
      <span className="sr-only">{count} pending </span>
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
    </span>
  );
}

function WithTooltip({ label, show, children }: { label: string; show: boolean; children: React.ReactElement }) {
  return (
    <Tooltip open={show ? undefined : false}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function NavLink({
  item,
  variant,
  badges,
  onNavigate,
  nested = false,
}: {
  item: NavLeaf;
  variant: Variant;
  badges: NavBadges;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const pathname = useAdminPathname();
  const iconOnly = useIconOnly(variant);
  const active = findActiveLeaf(pathname)?.id === item.id;
  const Icon = item.icon;
  const count = item.badgeKey ? badges[item.badgeKey] : undefined;

  return (
    <WithTooltip label={item.label} show={iconOnly}>
      <Link
        href={item.href}
        data-nav-item
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={cn(itemBase, active && [itemActive, activeBar], nested && "h-9 pl-3")}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden="true" />
        <span className={cn("truncate", hideWhenIconOnly(variant))}>{item.label}</span>
        <Badge count={count} variant={variant} />
      </Link>
    </WithTooltip>
  );
}

function NavParentItem({
  item,
  variant,
  badges,
  onNavigate,
}: {
  item: NavParent;
  variant: Variant;
  badges: NavBadges;
  onNavigate?: () => void;
}) {
  const pathname = useAdminPathname();
  const iconOnly = useIconOnly(variant);
  const active = isPathActive(item.prefix, pathname);
  const [open, setOpen] = useState(active);
  const Icon = item.icon;
  const total = item.children.reduce((sum, child) => sum + (child.badgeKey ? (badges[child.badgeKey] ?? 0) : 0), 0);

  // Auto-open when navigating into the section (state adjusted during render, not in an effect).
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (active) setOpen(true);
  }

  const triggerClasses = cn(itemBase, active && !open && [itemActive, activeBar]);

  if (iconOnly) {
    return (
      <DropdownMenu>
        <WithTooltip label={item.label} show>
          <DropdownMenuTrigger asChild>
            <button type="button" data-nav-item className={triggerClasses} aria-label={item.label}>
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              {total ? <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-primary" /> : null}
            </button>
          </DropdownMenuTrigger>
        </WithTooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={10}>
          <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children.map((child) => {
            const count = child.badgeKey ? badges[child.badgeKey] : undefined;
            return (
              <DropdownMenuItem key={child.id} asChild>
                <Link href={child.href} onClick={onNavigate} aria-current={isPathActive(child.href, pathname) ? "page" : undefined}>
                  {child.label}
                  {count ? <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{count}</span> : null}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button type="button" data-nav-item className={triggerClasses}>
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          <span className={cn("truncate", hideWhenIconOnly(variant))}>{item.label}</span>
          {total && !open ? <Badge count={total} variant={variant} /> : null}
          <ChevronDown
            className={cn(
              "ml-auto size-4 shrink-0 transition-transform",
              open && "rotate-180",
              total && !open && "ml-1",
              hideWhenIconOnly(variant),
            )}
            aria-hidden="true"
          />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className={cn("overflow-hidden", hideWhenIconOnly(variant))}>
        <ul className="ml-[1.35rem] mt-1 grid gap-1 border-l border-sidebar-border pl-3">
          {item.children.map((child) => (
            <li key={child.id}>
              <NavLink item={child} variant={variant} badges={badges} onNavigate={onNavigate} nested />
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function SidebarNav({
  variant,
  badges = {},
  onNavigate,
}: {
  variant: Variant;
  badges?: NavBadges;
  onNavigate?: () => void;
}) {
  // Arrow keys move between nav items (plan 0001 §27); Home / End jump to the ends.
  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-nav-item]")).filter(
      (el) => el.offsetParent !== null,
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    event.preventDefault();
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <nav aria-label="Main" onKeyDown={onKeyDown} className="grid gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="grid gap-1">
          <h2 className={cn("px-3 pb-1 text-xs font-medium text-muted-foreground", hideWhenIconOnly(variant))}>{group.label}</h2>
          {/* In icon-only mode the label is replaced by a hairline so groups stay distinguishable. */}
          {variant === "desktop" ? (
            <hr className="mx-3 hidden border-sidebar-border max-lg:block in-data-[sidebar=collapsed]:block" />
          ) : null}
          <ul className="grid gap-1">
            {group.items.map((item) => (
              <li key={item.id}>
                {isNavParent(item) ? (
                  <NavParentItem item={item} variant={variant} badges={badges} onNavigate={onNavigate} />
                ) : (
                  <NavLink item={item} variant={variant} badges={badges} onNavigate={onNavigate} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
