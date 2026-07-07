# LaFriend's Services Ménagers — Enhancement & Expansion Brief

> **Version:** 2.0  
> **Last Updated:** 2026-07-07  
> **Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase  
> **Audience:** OpenCode AI and equivalent coding agents  
> **Mandate:** Enhance, do not rebuild. Audit before acting. Preserve all existing business logic, features, workflows, brand identity, and navigation philosophy.

---

## Table of Contents

1. [Objective](#1-objective)
2. [Phase 1 — Mandatory System Audit](#2-phase-1--mandatory-system-audit)
3. [Enhancement Philosophy](#3-enhancement-philosophy)
4. [Enhancement Hierarchy](#4-enhancement-hierarchy)
5. [Functional Expansion Matrix](#5-functional-expansion-matrix)
6. [New Modules (Verify-Before-Build)](#6-new-modules-verify-before-build)
7. [UI Enhancement Checklist](#7-ui-enhancement-checklist)
8. [Admin Scalability Roadmap](#8-admin-scalability-roadmap)
9. [Future-Ready Architecture](#9-future-ready-architecture)
10. [Coding Agent Rules](#10-coding-agent-rules)
11. [Design System Reference](#11-design-system-reference)
12. [Appendix: Current Architecture Reference](#12-appendix-current-architecture-reference)

---

## 1. Objective

The LaFriend's Services application is **already functional** and contains numerous business features (booking system, admin dashboard, customer portal, live chat, loyalty program, KYC, bilingual i18n, and more).

The purpose of this project is **NOT** to:

- Redesign or rebuild from scratch
- Duplicate existing modules or functionality
- Alter the company's identity (logo, name, brand colors, typography family)
- Change existing navigation structure or workflows
- Modify marketing message, icons, or existing services

The objective is to:

| # | Priority | Goal |
|---|----------|------|
| 1 | **Critical** | Preserve all existing business logic, features, and workflows |
| 2 | **Critical** | Preserve brand identity, navigation philosophy, and public URLs |
| 3 | **High** | Improve usability, consistency, and visual hierarchy |
| 4 | **High** | Ensure responsiveness across 320px–1920px |
| 5 | **High** | Achieve WCAG AA accessibility compliance |
| 6 | **Medium** | Improve performance (Lighthouse 95+) |
| 7 | **Medium** | Improve maintainability (DRY, SOLID, KISS) |
| 8 | **Low** | Extend platform only where clear business value exists and no module currently covers the need |

---

## 2. Phase 1 — Mandatory System Audit

> **RULE:** Before implementing any enhancement, OpenCode AI **must** inspect the existing codebase and produce a complete inventory. No new feature may be developed until this audit is complete.

### 2.1 Pages Inventory

Catalog every existing page, classifying each as:

- **Complete** — Meets all functional requirements, needs only UI polish
- **Partial** — Has core functionality but is missing expected features
- **Needs UI** — Functionally complete but visually inconsistent with design system
- **Needs Backend** — Frontend exists but lacks proper data integration

#### Public Pages
| Page | Route | Classification | Notes |
|------|-------|----------------|-------|
| Index (Landing) | `/` | Needs UI | All sections present, needs design system alignment |
| Auth | `/auth` | Complete | Login, register, OAuth, OTP, password reset |
| Service Details | `/services/:serviceId` | Needs UI | Functional, needs richer layout |
| Pricing Guide | `/pricing-guide` | Needs UI | Content complete, visual polish needed |
| Quote Request | `/quote` | Complete | Form + validation + reCAPTCHA |
| Join Our Team | `/join-our-team` | Unknown | Verify if exists |
| Project Detail | `/projects/:slug` | Unknown | Verify if exists |
| 404 | `*` | Complete | |

#### Auth Pages
| Page | Route | Classification | Notes |
|------|-------|----------------|-------|
| Login/Register | `/auth` | Complete | |
| OAuth Consent | `/.lovable/oauth/consent` | Unknown | |

#### Dashboard Pages
| Page | Route | Classification | Notes |
|------|-------|----------------|-------|
| Admin Dashboard | `/admin` | Needs UI | 21 tabs, needs modular scaling |
| Admin Settings | `/admin/settings` | Unknown | |
| Admin Verifications | `/admin/verifications` | Unknown | KYC review |
| Admin Whoami | `/admin/whoami` | Unknown | |
| Customer Portal | `/customer-portal` | Needs UI | 7 tabs, needs consistency |

#### CMS Pages
| Page | Route | Classification | Notes |
|------|-------|----------------|-------|
| Service Management | `/admin?tab=services-management` | Complete | CRUD with features, FAQs, addons |
| Project Management | `/admin?tab=projects` | Complete | Portfolio CRUD |
| Review Management | `/admin?tab=reviews-management` | Complete | Moderation workflow |
| Feedback Management | `/admin?tab=feedback` | Complete | |

#### Utility Pages
| Page | Route | Classification | Notes |
|------|-------|----------------|-------|
| Onboarding (KYC) | `/onboarding` | Unknown | |
| Notification Center | (admin tab) | Unknown | |

### 2.2 Components Inventory

Catalog every shared component and its current state.

| Component | Status | Reusable? | Used By |
|-----------|--------|-----------|---------|
| Navbar | Complete | Yes | All public pages |
| Footer | Complete | Yes | All public pages |
| HeroSlideshow | Needs UI | No (homepage only) | Index |
| Services | Complete | No | Index |
| Gallery | Needs UI | Yes | Index |
| Testimonials | Complete | No | Index |
| Contact | Complete | Yes | Index |
| FAQ | Complete | Yes | Index, ServiceDetails |
| Pricing | Complete | No | Index |
| TrustBadges | Needs UI | No | Index |
| StatsCounter | Complete | No | Index |
| Newsletter | Complete | No | Index |
| About | Complete | No | Index |
| BookingForm | Complete | Yes | Index, ServiceDetails |
| BookingModal | Complete | Yes | Index, ServiceDetails |
| ChatWidget | Complete | Yes | All pages |
| WhatsAppButton | Complete | Yes | All pages |
| BackToTop | Complete | Yes | All pages |
| Seo | Complete | Yes | All pages |
| ErrorBoundary | Complete | Yes | App root |
| LanguageToggle | Complete | Yes | Navbar |
| SessionTimeoutDialog | Complete | Yes | Auth-protected pages |
| KycStatusBadge | Complete | Yes | Customer portal |

### 2.3 Features Inventory

Document every feature already implemented. For each, classify as:

- **Complete** — Fully functional, needs no changes
- **Partial** — Implemented but missing expected capabilities
- **Needs UI** — Functionally complete, needs visual enhancement
- **Needs Backend** — Frontend exists, backend integration incomplete
- **Needs Performance** — Works but could be faster/lighter
- **Future** — Currently absent, candidate for future expansion

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | Complete | Email/password, Google OAuth, Facebook OAuth, OTP, password reset |
| **Authorization (RBAC)** | Complete | admin/moderator/user roles via `user_roles` table + `has_role()` RPC |
| **Booking System** | Complete | Full CRUD, status management, recurring, reschedule, cancel |
| **Quote Requests** | Complete | Form with reCAPTCHA, service type/size/frequency fields + customer tracking tab |
| **Service Catalog** | Complete | DB-driven CRUD with categories, features, FAQs, addons, locations + search/category filters |
| **Reviews & Ratings** | Complete | Moderation (approve/reject/pin/feature), verified badges, audit logging, admin replies |
| **Before/After Gallery** | Complete | BeforeAfterSlider, fullscreen lightbox, search, category/location filters, sort, lazy loading |
| **Contact Forms** | Complete | Contact form with reCAPTCHA, inquiry categorization, preferred contact time, inbox management |
| **CMS Capabilities** | Complete | Services, projects, reviews, feedback CRUD via admin |
| **Media Management** | Complete | Admin Media Library: upload, browse, delete, preview, copy URL, per-bucket filtering |
| **Settings / Configuration** | Complete | Centralized hub with 11 sections (General, Website, Content, Media, Communication, SEO, Security, Performance, Analytics, Integrations, Backups) + Account management |
| **Notifications** | Complete | In-app notifications with read/unread, archive/restore, snooze, search, type filter, bulk archive/delete, group-by-category, preferences dialog (in-app/email/push per type) |
| **Live Chat** | Complete | Real-time messaging, file upload, voice recording, booking context |
| **Loyalty Program** | Complete | Points, rewards, tiers, referrals, transactions ledger |
| **KYC Verification** | Complete | Identity document upload, admin review, audit trail |
| **Search** | Future | Not implemented — candidate |
| **SEO** | Partial | Meta tags per page, JSON-LD for services — needs sitemap, robots.txt, redirects |
| **Analytics** | Complete | Recharts + configurable date range (7d/30d/90d/12m), KPICard with trend indicators |
| **Bilingual (FR/EN)** | Complete | Custom React Context, ~300 keys, language toggle |
| **Session Management** | Complete | 5-min inactivity timeout with 60s warning |
| **WhatsApp Integration** | Complete | Floating button, booking context links |
| **Newsletter** | Partial | Subscription collection — needs send capability, double opt-in |
| **Staff Management** | Complete | CRUD, availability, time-off, assignment |
| **Email Reminders** | Partial | Configuration exists — needs automated sending |
| **Report Generation** | Partial | CSV + PDF export for bookings, contacts, subscribers — needs server-side |
| **Receipts/Invoicing** | Partial | Per-booking PDF generation |
| **ReCAPTCHA v3** | Complete | Contact form protection with server-side verification |
| **Push Notifications** | Partial | Web push opt-in exists — needs broader integration |
| **PWA** | Future | Not implemented — candidate |
| **Payment Gateway** | Future | Not implemented — candidate |
| **Customer Portal** | Complete | Upcoming, recurring, history, notifications, fidelity, referral, settings, quotes tabs |
| **Error Handling** | Complete | ErrorBoundary, 404 page, form validation |
| **Mobile (Capacitor)** | Partial | Android configured — iOS needs verification |

---

## 3. Enhancement Philosophy

Every existing feature must first be evaluated using the following hierarchy:

```
1. IMPROVE THE UI        → Design system alignment, visual hierarchy, white space
2. IMPROVE RESPONSIVENESS → 320px–1920px, no overflow, touch-friendly
3. IMPROVE ACCESSIBILITY  → WCAG AA: keyboard nav, ARIA, contrast, screen readers
4. IMPROVE PERFORMANCE    → Lighthouse 95+, code splitting, lazy loading, image optimization
5. IMPROVE MAINTAINABILITY → DRY components, consistent patterns, clear naming
6. IMPROVE SCALABILITY    → Extensible architecture, modular admin, permission-aware
7. ONLY THEN              → Consider adding new capabilities (see matrix below)
```

**This is strict ordering.** Do not add new features until UI, responsiveness, accessibility, performance, and maintainability of existing features are satisfactory.

---

## 4. Enhancement Hierarchy

### 4.1 UI Enhancement Priority

Each page should be evaluated against the design system (Section 11) and enhanced in this order:

| Priority | Area | Target |
|----------|------|--------|
| P0 | Layout consistency | section-padding, section-container, responsive grid on every page |
| P0 | Typography scale | Hero 64px, Page Title 48px, Section Title 36px, Card Title 24px, etc. |
| P0 | Spacing scale | 4/8/12/16/24/32/48/64/96/128 throughout |
| P1 | Card consistency | card-hover, card-glass, or card-elevated on all card elements |
| P1 | Animation polish | fade-in-up, stagger delays on grids, scale-in on modals |
| P1 | Empty states | Every list/data view needs centered icon + message + CTA |
| P1 | Loading states | Skeleton loaders for async content |
| P2 | Icon consistency | Use lucide-react icons, consistent sizing (h-4 w-4 to h-8 w-8) |
| P2 | Hover/focus states | All interactive elements need hover + focus-visible styles |
| P2 | Color tokens | Use CSS variable colors, not raw hex values |

### 4.2 Responsiveness Checklist

| Requirement | Check |
|-------------|-------|
| No horizontal overflow at any breakpoint | Must verify 320px, 640px, 768px, 1024px, 1280px, 1920px |
| Touch targets ≥ 44×44px on mobile | All buttons, links, icons |
| Navbar collapses to hamburger on mobile | Verify |
| Grids collapse: 12-col → 8-col → 4-col | Desktop → Tablet → Mobile |
| Font sizes scale down on small screens | Responsive text classes (text-base md:text-lg) |
| Images have max-width: 100% | Verify |
| Forms are full-width on mobile | Verify |
| Modals are full-screen on mobile | Or near-full with padding |

### 4.3 Accessibility Checklist (WCAG AA)

| Category | Requirement |
|----------|-------------|
| Keyboard | All interactive elements reachable and operable via keyboard |
| Keyboard | No keyboard traps |
| Focus | Visible focus indicator on all interactive elements (focus-visible) |
| ARIA | Landmarks (nav, main, footer, section) with aria-label where needed |
| ARIA | aria-expanded on accordions/menus, aria-controls on tab panels |
| Images | alt text on all meaningful images, aria-hidden on decorative |
| Color | Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text |
| Color | Information not conveyed by color alone |
| Motion | Respect prefers-reduced-motion |
| Forms | Labels associated with inputs, error messages linked via aria-describedby |
| Screen Reader | Heading hierarchy (h1 → h2 → h3, no skips) |
| Screen Reader | Skip-to-content link |

### 4.4 Performance Checklist (Lighthouse 95+)

| Category | Target | Techniques |
|----------|--------|------------|
| Performance | ≥ 95 | Code splitting, lazy loading, image optimization, minimal JS |
| Accessibility | ≥ 95 | See checklist above |
| Best Practices | ≥ 95 | HTTPS, no console errors, modern JS |
| SEO | ≥ 95 | Meta tags, structured data, semantic HTML |
| PWA | n/a | Future consideration |

**Techniques to apply:**
- Lazy-load all route components (already done for most — verify)
- Defer non-critical JS (ChatWidget, heavy charts)
- Use loading="lazy" on below-fold images
- Use fetchpriority="high" on hero image
- Minimize layout shifts (explicit dimensions on all images)
- Compress images via Supabase transforms
- Bundle analysis — identify and split large dependencies

---

## 5. Functional Expansion Matrix

Instead of creating duplicate functionality, **extend existing modules.** The left column shows the existing module; the right column lists permissible enhancements:

### 5.1 Public Pages

| Existing Module | Enhancements (in priority order) | Status |
|----------------|----------------------------------|--------|
| **Homepage** | Improve layout, visual hierarchy, spacing, loading speed, responsiveness. Add scroll-triggered section animations. | Applied |
| **Services** | Add search, inline filtering by category, richer detail pages with service comparison. | Applied |
| **Before/After Gallery** | Add image comparison slider (BeforeAfterSlider), fullscreen lightbox, advanced filters (location, sort). | Applied |
| **Reviews** | Verified badges, featured review pinning, admin moderation with audit logging. | Applied |
| **Contact** | Inquiry categorization, preferred contact time field, CRM-ready tracking. | Applied |
| **Pricing Guide** | Add interactive price calculator, service comparison table, printable version. | Pending |

### 5.2 Transactional Features

| Existing Module | Enhancements (in priority order) | Status |
|----------------|----------------------------------|--------|
| **Quote Requests** | Add status tracking, customer-facing quotes tab in portal. | Applied |
| **Booking System** | Add staff calendar integration, booking reminders, waitlist, recurring booking templates. | Pending |
| **Receipts/Invoicing** | Add email delivery, receipt history in customer portal, tax breakdown, company info header. | Pending |

### 5.3 Admin Dashboard

| Existing Module | Enhancements (in priority order) | Status |
|----------------|----------------------------------|--------|
| **Dashboard Analytics** | Add more KPI widgets (daily bookings, revenue trend, customer growth), configurable widgets, date range selector, export dashboard as PDF. | Pending |
| **Recent Activity** | Already has ActivityFeed — add filters, search, expandable details. | Pending |
| **Quick Actions** | Add customizable shortcuts, recent actions list. | Pending |

### 5.4 Customer Portal

| Existing Module | Enhancements (in priority order) | Status |
|----------------|----------------------------------|--------|
| **Profile Summary** | Add loyalty progress bar, next milestone indicator, quick stats. | Pending |
| **Booking Management** | Add bulk actions, calendar view toggle, booking timeline. | Pending |
| **Notifications** | Add notification preferences, grouping by type, archive/delete. | Pending |
| **Fidelity/Loyalty** | Add reward progress visualization, points expiration warnings, reward recommendations. | Pending |
| **Quote Tracking** | Customer-facing quotes tab with status tracking (unread/read/replied). | Applied |

### 5.5 Content Management

| Existing Module | Enhancements (in priority order) | Status |
|----------------|----------------------------------|--------|
| **Media Library** | Admin component with upload, browse, delete, preview, copy URL, per-bucket filtering. | Applied |
| **Service Management** | Add service duplication, batch status updates, preview link. | Pending |
| **Project Management** | Add drag-and-drop image reorder, bulk publish/archive, project analytics. | Pending |

### 5.6 System Features

| Existing Module | Enhancements (in priority order) |
|----------------|----------------------------------|
| **SEO** | Add sitemap.xml generation, robots.txt management, 301 redirects manager, meta preview tool, Open Graph image generator. |
| **Users & Roles** | Add user activity log, login history, role assignment UI, permission matrix. |
| **Notifications** | Add notification templates, send test, delivery analytics, digest preferences. |
| **Email Reminders** | Add template editor, send test, scheduling UI, delivery logs. |

---

## 6. New Modules (Verify-Before-Build)

> **RULE:** OpenCode AI **must** verify whether these modules already exist (even partially) before creating them. Check the codebase, routes, components, and database tables.

### 6.1 Customer Portal Enhancements

If any of these do **not** exist, they may be added:

| Module | Description | Dependencies |
|--------|-------------|--------------|
| Quote Tracking | Customer-facing status page for submitted quotes | QuoteRequest, notifications |
| Project History | Timeline view of all past projects with before/after | Projects, project_images |
| Appointment Reminders | SMS/email reminders before scheduled service | Edge functions, email_reminders |

### 6.2 Appointment Management

If these do **not** exist:

| Feature | Description |
|---------|-------------|
| Booking Calendar | Visual calendar of bookings (verify if `BookingCalendar.tsx` covers this) |
| Staff Scheduling | Staff availability and shift management |
| Visit Reminders | Automated customer reminders |
| Appointment History | Past appointments with details |

### 6.3 Project Management

If these do **not** exist:

| Feature | Description |
|---------|-------------|
| Project Lifecycle | Draft → Published → Archived |
| Assigned Team | Staff assignment to projects |
| Milestones | Key project milestones with dates |
| Before/After Documentation | Systematic before/after image pairs |
| Completion Reports | PDF summary of completed project |

### 6.4 Notification Center (Unified)

If a unified notification center does **not** exist, extend the existing `notifications` table with:

- Unified inbox for quotes, reviews, contact forms, system alerts, maintenance
- Group by category
- Read/unread/archive states
- In-app + email + push delivery
- User preferences (what to receive, how often)

### 6.5 Settings Center

If a centralized settings hub does **not** exist, create one with sections. Only create sections that do **not** already exist — extend existing settings UIs where possible:

| Section | Contents | Already Exists? |
|---------|----------|-----------------|
| General | Site name, logo, favicon, contact info | Partial |
| Website | Maintenance mode, custom CSS, analytics ID | Verify |
| Content | Default thumbnail, image sizes, allowed types | Verify |
| Media | Storage bucket config, optimization settings | Verify |
| Communication | Email templates, SMS config, WhatsApp default message | Verify |
| SEO | Default meta, sitemap auto-generation, social preview | Verify |
| Security | reCAPTCHA keys, rate limits, session timeout, password policy | Verify |
| Performance | Caching, CDN, image compression level | Verify |
| Analytics | Tracking IDs, dashboard config, export settings | Verify |
| Integrations | OAuth providers, webhooks, API keys | Verify |
| Backups | Schedule, retention, manual backup trigger | Verify |

---

## 7. UI Enhancement Checklist

Every page modified or created **must** satisfy all of the following before being considered complete:

### 7.1 Layout

- [ ] Uses `section-padding` or consistent vertical spacing
- [ ] Uses `section-container` or consistent horizontal constraints
- [ ] Responsive grid (12-col desktop → 8-col tablet → 4-col mobile)
- [ ] Clear visual hierarchy (headings → subheadings → body → captions)
- [ ] Balanced whitespace (not cramped, not sprawling)
- [ ] No horizontal scroll at any breakpoint

### 7.2 Components

- [ ] Buttons use consistent variants (default, outline, ghost, CTA)
- [ ] Cards use `card-hover`, `card-glass`, or `card-elevated`
- [ ] Forms have accessible labels, error states, and validation
- [ ] Tables have consistent header styling, hover rows, responsive handling
- [ ] Typography follows the scale (Section 11.2)
- [ ] Icons are lucide-react, consistently sized, properly aria-labeled

### 7.3 Interaction

- [ ] Smooth hover states on all interactive elements
- [ ] Loading indicators (spinner or skeleton) for all async content
- [ ] Empty states with icon, message, and action (when data is empty)
- [ ] Success/error feedback via toast (Sonner) on all mutations
- [ ] Keyboard navigation works end-to-end on the page

### 7.4 Mobile

- [ ] Touch-friendly controls (≥ 44×44px tap targets)
- [ ] Optimized navigation (hamburger on mobile)
- [ ] No overflow, no horizontal scroll
- [ ] Forms are full-width on small screens
- [ ] Responsive images with max-width: 100%
- [ ] Fast loading on 3G (test with network throttling)

### 7.5 Animation

- [ ] Use CSS transform-based animations only (fade, slide, scale)
- [ ] Staggered delays for grid items (stagger-1 through stagger-8)
- [ ] Respect prefers-reduced-motion
- [ ] No animation on structural elements (navbar, footer)

---

## 8. Admin Scalability Roadmap

Rather than continuously adding pages/URLs, evolve the admin panel into a **modular platform**. The current tab-based approach (`?tab=`) inside `Admin.tsx` is acceptable but should be structured for independent extensibility.

### 8.1 Module Architecture

Each admin module should follow this pattern:

```
Module {
  key: string          // unique tab key
  label: string        // display name
  icon: LucideIcon     // icon component
  component: ReactNode // lazy-loaded page content
  permissions: string[] // required roles
  order: number        // sidebar display order
}
```

### 8.2 Core Modules

| Module | Tab Key | Priority | Status |
|--------|---------|----------|--------|
| Dashboard | `analytics` | Core | Exists |
| Bookings | `bookings` | Core | Exists |
| Calendar | `calendar` | Core | Exists |
| Contacts | `contacts` | Core | Exists |
| Services | `services-management` | Core | Exists |
| Portfolio | `projects` | Core | Exists |
| Reviews | `reviews-management` | Core | Exists |
| Feedback | `feedback` | Core | Exists |
| Quotes | (new) | High | Future |
| Media | `media` (new) | High | Future |
| Staff | `staff` / `staff-management` | Core | Exists |
| Subscribers | `subscribers` | Core | Exists |
| Notifications | `notifications` / `broadcast` | Core | Exists |
| Loyalty | `loyalty` | Core | Exists |
| Referrals | `referrals` | Core | Exists |
| Reports | `reports` | Core | Exists |
| Reminders | `reminders` | Core | Exists |
| Receipts | `receipts` | Core | Exists |
| Users | (new) | Medium | Future |
| Roles & Permissions | (new) | Medium | Future |
| SEO | (new) | Medium | Future |
| Analytics | (new) | Medium | Future (EnhancedAnalytics exists as tab) |
| Settings | `settings` | Core | Complete (separate route, 11-section hub) |
| Audit Logs | (new) | Low | Future |
| Backups | (new) | Low | Future |

### 8.3 Module Requirements

Each module should be:

- **Independently extensible** — Adding a new module should not require modifying existing modules
- **Permission-aware** — Modules check `user_roles` before rendering content
- **Lazy-loaded** — Each module component is a dynamic import
- **Consistent** — Same layout, same action patterns, same table/card patterns
- **Mobile-friendly** — Sidebar collapses, tables scroll horizontally, modals go full-screen

---

## 9. Future-Ready Architecture

Without implementing everything immediately, the architecture should **accommodate** future additions. This means:

| Future Feature | Architecture Requirement |
|----------------|-------------------------|
| **Customer Portal** | Already exists — keep extensible |
| **Employee Portal** | Keep auth roles extensible (add `employee` role) |
| **Progressive Web App (PWA)** | Keep Vite config ready for service worker, manifest |
| **Mobile Applications** | Capacitor already configured — maintain |
| **Payment Gateways** | Keep `bookings` table ready for `payment_status`, `payment_method` columns |
| **CRM Integration** | Keep contact_submissions, quotes extensible with external_id |
| **ERP Integration** | Keep services, bookings, staff tables compatible |
| **AI Assistants** | Supabase Edge Functions already support this pattern |
| **Multi-Language Support** | i18n system already designed for expansion (add keys, not files) |
| **Multi-Location Management** | Add `location_id` foreign key to relevant tables |
| **Multi-Currency Support** | Services already has `currency` column |

**Do not implement these now.** Just ensure the database schema, component architecture, and route structure do not block them.

---

## 10. Coding Agent Rules

> These rules are **binding** on OpenCode AI and any equivalent coding agent.

### 10.1 Before Any File Modification

1. **Identify existing functionality** — Search the codebase thoroughly before adding anything new. Check routes, components, hooks, contexts, database tables, RPCs, and edge functions.
2. **Reuse existing components** — If a component already does 80% of what you need, extend it. Do not create a new one.
3. **Refactor rather than duplicate** — If you see similar code in two places, unify them before adding a third.
4. **Preserve public APIs and URLs** — Do not change route paths, function signatures, or exported interfaces unless explicitly approved.
5. **Maintain backwards compatibility** — New code must not break existing functionality. Test by verifying that existing pages render without console errors.

### 10.2 During Modification

6. **Document every structural change** — Add comments for non-obvious design decisions. Update this document when adding pages, components, or features.
7. **Ensure new components are reusable** — Any new component should accept props for customization and should not be hardcoded to a single use case.
8. **Validate responsiveness** — Check at 320px, 768px, 1024px, 1440px, 1920px after every significant UI change.
9. **Run accessibility checks** — Use browser DevTools Lighthouse tab after every page change.
10. **Run performance checks** — Verify no regressions in Lighthouse scores.
11. **Avoid introducing breaking changes** — Do not rename existing CSS classes, Tailwind utilities, or component props that are used in multiple places.

### 10.3 Code Quality

12. **Design system tokens** — Use CSS variables and Tailwind config values only. No hardcoded colors, font sizes, or spacing values.
13. **Animation rules** — CSS transforms only (translate, scale, opacity, rotate). Never animate width, height, top, left, margin, padding, or border — these trigger layout recalculations.
14. **No emojis** — Use lucide-react icons instead of Unicode emoji characters in the UI.
15. **No comments in production code** — Add comments only for complex logic that is not self-documenting.
16. **Consistent imports** — Use absolute imports where configured (@/), relative imports for same-directory.
17. **TypeScript strictness** — Avoid `any`. Use proper types from `@/integrations/supabase/types` or define interfaces.

### 10.4 Audit Trail

18. **Maintain this document** — Update the Feature Inventory (Section 2.3) when features change status.
19. **Commit discipline** — Do not commit unless explicitly asked. When committing, write concise messages matching repo style.

---

## 11. Design System Reference

### 11.1 Colors (CSS Variables)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | 0 0% 100% | 222 20% 14% | Page background |
| `--foreground` | 240 60% 12% | 210 20% 92% | Text |
| `--primary` | 240 60% 12% | 43 90% 55% | Headers, nav |
| `--primary-foreground` | 0 0% 100% | 240 60% 12% | Text on primary |
| `--secondary` | 240 20% 96% | 222 16% 22% | Section backgrounds |
| `--accent` | 43 96% 56% | 43 90% 55% | CTAs, highlights |
| `--accent-foreground` | 240 60% 12% | 240 60% 12% | Text on accent |
| `--card` | 0 0% 100% | 222 18% 18% | Card backgrounds |
| `--muted` | 240 20% 96% | 222 16% 22% | Subtle backgrounds |
| `--border` | 240 20% 90% | 222 15% 28% | Borders |

### 11.2 Typography Scale

| Token | Size | Class | Usage |
|-------|------|-------|-------|
| Hero | 64px | `text-5xl` | Hero slideshow headings |
| Page Title | 48px | `text-4xl` | Section main titles |
| Section Title | 36px | `text-3xl` | Section headings |
| Card Title | 24px | `text-2xl` | Card titles |
| Subtitle | 18px | `text-lg` | Subtitles |
| Body | 16px | `text-base` | Paragraph text |
| Caption | 14px | `text-sm` | Labels, metadata |

### 11.3 Spacing Scale

```
4px  8px  12px  16px  24px  32px  48px  64px  96px  128px
```

### 11.4 Grid System

| Breakpoint | Columns | Container |
|------------|---------|-----------|
| Mobile (<640px) | 4 | Full width + 16px padding |
| Tablet (640–1024px) | 8 | 640px max + 32px padding |
| Desktop (>1024px) | 12 | 1280px max + 32px padding |

### 11.5 Utility Classes

| Class | Definition |
|-------|-----------|
| `section-padding` | `py-16 md:py-24 lg:py-32` |
| `section-container` | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| `section-title` | `text-3xl md:text-4xl font-bold text-center mb-4` |
| `section-subtitle` | `text-base md:text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12` |
| `card-hover` | Subtle lift + shadow on hover |
| `card-glass` | Frosted glass with backdrop blur |
| `card-elevated` | Subtle shadow with enhanced shadow on hover |

### 11.6 Animation Classes

| Class | Effect |
|-------|--------|
| `animate-fade-in` | opacity 0 → 1, 0.5s |
| `animate-fade-in-up` | opacity 0 + translateY(20px) → 0, 0.6s |
| `animate-fade-in-down` | opacity 0 + translateY(-20px) → 0, 0.5s |
| `animate-slide-in-left` | translateX(-20px) → 0, 0.5s |
| `animate-slide-in-right` | translateX(20px) → 0, 0.5s |
| `animate-scale-in` | scale(0.95) → 1, 0.3s |
| `animate-pulse-soft` | Gentle pulse, 2s infinite |
| `animate-float` | Vertical float, 3s infinite |
| `stagger-1` through `stagger-8` | 0.1s through 0.8s animation-delay |

**Animation Rules:**
- Use `animate-fade-in-up` for sections scrolling into view
- Use `stagger-N` classes on grid children for sequential reveal
- Use `animate-scale-in` for modals and dialogs
- Use `animate-pulse-soft` for loading skeletons
- Respect `prefers-reduced-motion: reduce` by disabling non-essential animations

---

## 12. Appendix: Current Architecture Reference

> This section is a condensed reference of the current codebase. It is **not** a specification for future work — it exists so the agent can understand what already exists before making changes.

### 12.1 Route Map

| Path | Component | Auth | Lazy | Description |
|------|-----------|------|------|-------------|
| `/` | `Index` | No | No | Landing page |
| `/auth` | `Auth` | No | Yes | Login / Register / OTP / Reset |
| `/admin` | `Admin` | Admin | Yes | Dashboard (tab-based: ?tab=) |
| `/admin/settings` | `AdminSettings` | Admin | Yes | Admin settings |
| `/admin/verifications` | `AdminVerifications` | Admin | Yes | KYC review |
| `/admin/whoami` | `AdminWhoami` | Admin | Yes | Admin profile |
| `/customer-portal` | `CustomerPortal` | User | Yes | Customer self-service |
| `/onboarding` | `Onboarding` | User | Yes | KYC verification |
| `/services/:serviceId` | `ServiceDetails` | No | Yes | Service detail page |
| `/quote` | `QuoteRequest` | No | Yes | Quote request form |
| `/pricing-guide` | `PricingGuide` | No | Yes | Pricing information |
| `/join-our-team` | `WorkerRegistration` | No | Yes | Job application |
| `/projects/:slug` | `ProjectDetail` | No | Yes | Portfolio project detail |
| `*` | `NotFound` | No | No | 404 page |

### 12.2 Database Summary (38 Tables)

- **Bookings & Customers:** `bookings`, `profiles`, `contact_submissions`, `reviews`, `feedback`, `feedback_ratings`, `newsletter_subscribers`
- **Staff:** `staff_members`, `staff_emails`, `staff_availability`, `staff_time_off`
- **Services & Content:** `services`, `service_categories`, `service_images`, `service_features`, `service_addons`, `service_faqs`, `service_locations`, `service_analytics`, `projects`, `project_images`
- **Loyalty:** `loyalty_rewards`, `loyalty_transactions`, `customer_rewards`, `referrals`
- **Chat:** `chat_rooms`, `chat_participants`, `chat_messages`, `chat_read_receipts`
- **Admin & Security:** `user_roles`, `identity_documents`, `customer_kyc`, `worker_kyw`, `kyc_decision_audit`
- **System:** `notifications`, `email_reminders`, `audit_logs`, `before_after_projects`

### 12.3 Edge Functions (21)

`send-booking-confirmation`, `send-status-notification`, `send-cancellation-notification`, `send-reschedule-notification`, `send-notification`, `send-sms-notification`, `send-feedback-request`, `send-kyc-reminder`, `send-kyc-decision`, `send-referral-notification`, `send-admin-digest`, `send-appointment-reminder`, `broadcast-notification`, `chat-support`, `verify-recaptcha`, `export-reports`, `get-referral-leaderboard`, `mcp` (+ 3 unaccounted)

### 12.4 Key Files

```
src/
├── App.tsx, main.tsx, index.css
├── components/         # ~60+ components
│   ├── admin/          # 26 admin components
│   ├── chat/           # Chat system
│   ├── customer/       # Portal components (7 files)
│   └── ui/             # 35+ shadcn/ui primitives
├── contexts/           # LanguageContext
├── hooks/              # useAuth, useFeedback, useIdleLogout, useScrollReveal, etc.
├── integrations/supabase/  # client.ts, types.ts
├── lib/                # utils, validation, export, invoice, mediaUpload, recaptcha, logger
└── pages/              # 15 page components
```

### 12.5 Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key |
| `VITE_APP_URL` | Application base URL |
| `SUPABASE_URL` | (Server) Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | (Server) Service role key |

---

*End of Enhancement & Expansion Brief — LaFriend's Services Ménagers v2.0*

**Next step for any agent reading this document:**
1. Read all files referenced in the current module/feature
2. Complete the audit checklist for the area of work
3. Apply the enhancement hierarchy
4. Validate against the UI Enhancement Checklist
5. Verify no existing functionality is broken
