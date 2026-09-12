# NeuroNest — Frontend

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.badge?style=for-the-badge)](LICENSE)

**Nurture · Support · Empower**

*A science-backed, human-reviewed digital health companion for parents of children (ages 2–8) with neurodevelopmental differences — ADHD, Autism, sensory processing differences, and developmental delays.*

[Explore the Routes](#-routes--pages) • [Getting Started](#-getting-started) • [Design System](#-design-system) • [Architecture](#-architecture)

</div>

---

## 📖 Overview

**NeuroNest** bridges the critical gap between prolonged clinical waitlists and everyday parenting needs. Parents capture short video moments of everyday play, communication, and emotional regulation; licensed pediatric professionals (SLTs, OTs, child psychologists) review the footage and build personalised, strengths-based developmental care plans.

### Key Capabilities

- **Human-in-the-Loop Clinical Guidance:** Every video analysis is validated and synthesized by qualified clinicians — AI serves only to assist transcription, never to diagnose autonomously.
- **Dedicated Route Architecture:** Tailored pathways for parents, clinician partners, workflow explanation, categorized FAQs, and GDPR-compliant safeguarding policies.
- **Component-Driven Atomic Primitives:** Clean design system built with custom UI primitives (`Button`, `Badge`, `Card`, `SectionHeader`, `Accordion`, `Input`, `Container`).
- **Data-Driven Content Layer:** All marketing copy, labels, and structured data live modularly in `src/content/`, keeping components clean and content easily translatable.
- **Type-Safe Server Actions & Webhooks:** High-performance Next.js Server Actions validated with Zod schemas, with zero-latency Google Sheets webhook synchronization.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16.3.4](https://nextjs.org/) (App Router, Turbopack, React Server Components) |
| **UI Library** | [React 19.2.8](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS Design System |
| **Animations** | [Motion](https://motion.dev/) (`motion/react` v13+) |
| **Iconography** | [Lucide React](https://lucide.dev/) |
| **Validation** | [Zod v4](https://zod.dev/) |
| **Fonts** | Lora (Editorial Serif), Caveat (Warm Handwritten Script), Inter (Clean UI Sans) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later (or `pnpm` / `yarn` / `bun`)

### 1. Clone & Install

```bash
git clone https://github.com/shubhamsingh325601/neuronest-frontend.git
cd neuronest-frontend
npm install
```

### 2. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:

```env
# Site URL for canonical metadata & sitemaps
NEXT_PUBLIC_SITE_URL=https://neuronest.co.uk

# Optional: Google Sheets Webhook URL for real-time lead capture
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/your-deployment-id/exec
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack |
| `npm run build` | Compiles production bundle & generates static routes |
| `npm run start` | Serves the production build locally |
| `npm run lint` | Runs ESLint checks across all TypeScript and React files |
| `npm run typecheck` | Executes TypeScript compiler typecheck (`tsc --noEmit`) |

---

## 🌐 Routes & Pages

| Route | Purpose | Features |
| :--- | :--- | :--- |
| `/` | Main Landing Page | Hero art, Empathy story, 4-Pillar Features, Workflow preview, Trust badges, Forms |
| `/for-parents` | Parent Experience | Strengths-based milestone tracking, video capture guidance, family testimonials |
| `/for-clinicians` | Clinician Portal | Partner accreditation, flexible caseload review, clinical governance, lead capture |
| `/how-it-works` | Deep-Dive Methodology | Detailed 4-step pipeline, clinical team qualifications, data safeguarding |
| `/faq` | Categorized FAQ | Interactive searchable accordion across clinical, privacy, pricing, and video capture |
| `/privacy` | Privacy & Safeguarding | UK GDPR, ICO registration, pediatric data compliance, NHS-informed standards |
| `/sitemap.xml` | XML Sitemap | Dynamic SEO sitemap with priority weights and last-modified dates |
| `/robots.txt` | Crawler Instructions | Dynamic robots directives indexing valid public pages |

---

## 📁 Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root HTML shell, fonts (Lora, Caveat, Inter), SEO metadata
│   ├── page.tsx                # Homepage composed of modular sections
│   ├── for-parents/page.tsx    # Dedicated Parent Experience route
│   ├── for-clinicians/page.tsx # Clinician partnership & onboarding route
│   ├── how-it-works/page.tsx   # Video review pipeline & clinical safeguarding route
│   ├── faq/page.tsx            # Categorized FAQ accordion route
│   ├── privacy/page.tsx        # GDPR & pediatric safeguarding compliance route
│   ├── globals.css             # Design tokens, Tailwind v4 directives, custom styles
│   ├── actions.ts              # Next.js Server Actions (waitlist, clinician lead, newsletter)
│   ├── robots.ts               # Dynamic robots.txt generation
│   ├── sitemap.ts              # Dynamic XML sitemap generation
│   ├── not-found.tsx           # Custom accessible 404 page
│   └── error.tsx               # Client error boundary
├── components/
│   ├── ui/                     # Atomic UI primitives
│   │   ├── button.tsx          # Variants (primary, secondary, outline, ghost), pill styling
│   │   ├── badge.tsx           # Tone-mapped badges (Sage, Terracotta, Amber, Slate)
│   │   ├── card.tsx            # Base card, elevated card, feature card
│   │   ├── section-header.tsx  # Script eyebrow + editorial serif heading + subtitle
│   │   ├── accordion.tsx       # Smooth accessible expandable items
│   │   ├── input.tsx           # FormField, Input, Select, Textarea
│   │   └── container.tsx       # Responsive max-width container wrapper
│   ├── layout/                 # Global layout shell
│   │   ├── site-header.tsx     # Brand navigation, mobile sliding drawer, primary CTA
│   │   └── site-footer.tsx     # Dual SVG wave, navigation links, newsletter signup
│   ├── sections/               # Composed page sections
│   │   ├── hero.tsx            # Hero artwork, floating pills, quote, action triggers
│   │   ├── empathy.tsx         # Empathy problem narrative, guiding principle pull-quote
│   │   ├── feature-grid.tsx    # 4 foundational care cards with colored icon badges
│   │   ├── how-it-works.tsx    # 4-step workflow + phone mockup + parent testimonial card
│   │   ├── clinicians.tsx      # Exact Clinicians card (avatar, quote, badges, tags)
│   │   ├── trust.tsx           # Trust & Ethics compliance checklist card
│   │   ├── closing.tsx         # Nest branches visual, community items, join CTA card
│   │   ├── lead-forms.tsx      # Parent waitlist form + Clinician registration form
│   │   └── faq.tsx             # Interactive FAQ accordion
│   └── interactive/            # Client-side animation & interactive widgets
│       ├── phone-mock.tsx      # Realistic iOS mockup with status bar, tabs, and plan preview
│       ├── progress-ring.tsx   # SVG animated circle progress indicator
│       └── motion-reveal.tsx   # Scroll entrance wrapper with Motion
├── content/                    # Modular typed content source files
│   ├── home.ts                 # Landing page copy & sections
│   ├── for-parents.ts          # Parent journey content
│   ├── for-clinicians.ts       # Clinician collaboration content
│   ├── how-it-works.ts         # Clinical pipeline & security data
│   ├── faq.ts                  # Categorized questions & answers
│   ├── privacy.ts              # Legal, GDPR, and safeguarding disclosures
│   ├── site.ts                 # Brand configuration, nav items, and footer links
│   └── index.ts                # Central barrel export
├── lib/
│   ├── content.ts              # Re-export barrel for backward compatibility
│   ├── schemas.ts              # Zod validation schemas for forms
│   ├── seo.ts                  # Metadata helpers & JSON-LD schema generators
│   ├── theme.ts                # Color token constants & helper maps
│   └── utils.ts                # cn() class merge helper (clsx + tailwind-merge)
public/
└── assets/                     # Static graphics, brand assets, and icons
```

---

## 🎨 Design System

The NeuroNest design language conveys warmth, clinical credibility, and calm reassurance:

- **Color Palette:**
  - **Cream Canvas:** `#FDFBF7` (gentle on sensory-sensitive eyes)
  - **Warm Sage:** `#5B8266` / `#E8EFE9` (growth, calm, reassurance)
  - **Terracotta:** `#C86D51` / `#FAEDE8` (human connection, empathy)
  - **Soft Amber:** `#D99B26` / `#FDF6E2` (celebration, milestones)
  - **Deep Slate:** `#2C3E50` (readability and contrast)
- **Typography:**
  - **Headings:** `Lora` (warm, editorial serif)
  - **Eyebrows & Accents:** `Caveat` (approachable, human handwritten script)
  - **Body & Controls:** `Inter` (neutral, legible sans-serif)

---

## 🔒 Security & Data Safeguarding

- **GDPR & UK Data Protection:** All video data is encrypted in transit and at rest.
- **Zero Autonomous AI Diagnosis:** AI is utilized strictly for speech transcription and workflow triage. Clinical recommendations are formed and signed off exclusively by qualified human practitioners.
- **Environment Isolation:** Secrets and webhook URLs are maintained strictly in `.env.local` and never tracked in source control.

---

## 👤 Author

**Shubham Singh**  
- Email: [shubham.singh325601@gmail.com](mailto:shubham.singh325601@gmail.com)  
- GitHub: [@shubhamsingh325601](https://github.com/shubhamsingh325601)  
- Repository: [neuronest-frontend](https://github.com/shubhamsingh325601/neuronest-frontend.git)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).