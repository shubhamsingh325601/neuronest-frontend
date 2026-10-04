# Design System

Visual language and component conventions for the NeuroNest frontend. Ported from the approved reference (`index_new/`) with 100% design fidelity.

## Tokens

Defined in **`src/app/(public)/globals.css`** under `:root`:

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#FBF3EC` | Page background (warm off-white) |
| `--color-surface` | `#FFFFFF` | Cards, inputs |
| `--color-surface-alt` | `#FCF6F0` | Alternating section bands |
| `--color-text` / `--color-text-muted` | `#332C26` / `#6E6259` | Body / secondary text |
| `--color-border` | `#EBDFD3` | Hairlines & borders |
| `--color-coral` / `-deep` / `-tint` | `#E2775B` / `#C85F45` / `#FBE3DA` | Primary CTA + accent |
| `--color-gold` / `-deep` / `-tint` | `#C4922E` / `#A97B22` / `#F5E6C6` | Warm highlights |
| `--color-sage` / `-deep` / `-tint` | `#6E8261` / `#566A4B` / `#E4EAE0` | Secondary accent, footer |
| `--color-focus-ring` | `#A64B32` | Keyboard focus ring |
| `--font-serif` | Lora | Headings |
| `--font-script` | Caveat | Accent script lines |
| `--font-sans` | Inter | Body / UI |
| `--fs-*` | clamp() scale | Fluid typography |
| `--space-*` / `--radius-*` | fixed scale | Spacing & border radii |

## Typography

- **Lora** — all headings (`h1`–`h4`), serif, weight 500/600.
- **Caveat** — `.script-line` accents (softened script lines), weight 500/600.
- **Inter** — body text, form labels, buttons, navigation.

Fonts load self-hosted via `next/font/google` in `src/app/(public)/layout.tsx` for optimal performance.

## Atomic Primitives (`src/components/ui/`)

- `Button` — Pill/rounded variants, sizes (`sm`, `md`, `lg`), link support, icon slots.
- `Badge` / `IconBadge` — Hero pills (`Understand`, `Nurture`, `Empower`), clinical tags, feature badges.
- `Card` — Container card with variants (`feature`, `form`, `testimonial`, `cta`).
- `SectionHeader` — Standardized Caveat script eyebrow + Lora serif heading.
- `Accordion` — Accessible FAQ accordion with smooth open/close animations.
- `FormField`, `Input`, `Select` — Accessible form elements with validation error states.
- `Container` — Responsive max-width container wrapper.

## Motion & Interactivity

- `MotionReveal` — Viewport scroll entrance animation wrapper powered by `motion/react`.
- `PhoneMock` & `ProgressRing` — Dynamic mobile UI with SVG progress ring indicator.

## Admin design system

The Admin app has its own, separate design system; none of the above applies to it, but its palette is derived from the landing brand (white background with warm tints, deepened coral primary, sage secondary and brand panel, gold highlight, warm-brown text; dark mode is a cool near-black "ink", with the coral kept as the accent). Primary is a deeper coral than the landing CTA so white text passes AA. Tokens live in `src/modules/admin/styles/admin.css` (imported only by the admin root layout): semantic OKLCH variables for light and dark, exposed to Tailwind via `@theme inline` (`bg-background`, `text-muted-foreground`, `bg-sidebar`, ...), with `@custom-variant dark` keyed on a `.dark` class. Inter is the only font (`--font-admin-inter`).

- **Theme:** `light | dark | system`. `ThemeProvider` (`src/modules/admin/theme/`) plus a pre-paint inline script write `.dark` / `color-scheme` on `<html>`; the preference is stored in `localStorage` (`nn-admin-theme`). A unit test checks AA contrast of the key token pairs by reading `admin.css` itself, so change token values there and the test follows.
- **Primitives** (`src/modules/admin/ui/`, copy-in style on `radix-ui` + `class-variance-authority`): Button, Input, Field, Card, Badge, StatusBadge, Skeleton, Tooltip, Dialog, ConfirmDialog, DropdownMenu, Sheet, Toaster. More are added in the milestone that first needs them.
- **StatusBadge** is the single place mapping backend status enums to a tone. Status is always text plus icon, never colour alone.
- **Toasts:** import `toast` from `src/modules/admin/notifications/toast.ts`, never from `sonner` directly.
- Colours come only from tokens (enforced by lint). Overlays use the `admin-*` keyframes defined in `admin.css`.
- **Fonts and isolation:** the admin `next/font` Inter deliberately uses a different variable name and `fallback` from the landing's. With identical options Turbopack merged both roots' font CSS into one shared chunk, which leaked Lora/Caveat declarations into the admin page.
