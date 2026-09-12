# Design System

Visual language and component conventions for the NeuroNest frontend. Ported from the approved reference (`index_new/`) with 100% design fidelity.

## Tokens

Defined in **`src/app/globals.css`** under `:root`:

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

Fonts load self-hosted via `next/font/google` in `src/app/layout.tsx` for optimal performance.

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