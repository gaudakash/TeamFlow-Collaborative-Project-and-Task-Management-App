import type { Metadata } from "next";
import Link from "next/link";
import {
  Keyboard,
  ListFilter,
  MessageSquare,
  MousePointerClick,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

// Static page (no cookies, no data fetching) → pre-rendered at build time, served from the CDN
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: Zap,
    title: "Real-time collaboration",
    description:
      "See teammates move, create, and comment on tasks instantly. No refresh needed.",
  },
  {
    icon: MousePointerClick,
    title: "Drag-and-drop boards",
    description:
      "Move work across Backlog, To Do, In Progress, Review, and Done with mouse, touch, or keyboard.",
  },
  {
    icon: ShieldCheck,
    title: "Roles & permissions",
    description:
      "Admins manage members and boards. Access is enforced in the database, not just the UI.",
  },
  {
    icon: ListFilter,
    title: "Search & filters",
    description:
      "Filter by priority, assignee, status, and due date. Share any filtered view with a link.",
  },
  {
    icon: MessageSquare,
    title: "Task discussions",
    description:
      "Keep decisions and context in one place with comments on every task.",
  },
  {
    icon: Keyboard,
    title: "Accessible by design",
    description:
      "Keyboard shortcuts, screen reader announcements, and full dark mode support.",
  },
];

const previewColumns = [
  {
    label: "To Do",
    dot: "bg-blue-500",
    cards: ["Write launch copy", "Set up analytics"],
  },
  { label: "In Progress", dot: "bg-amber-500", cards: ["Design landing hero"] },
  {
    label: "Done",
    dot: "bg-emerald-500",
    cards: ["User interviews", "Pick a product name"],
  },
];

const techStack = [
  "Next.js",
  "TypeScript",
  "Supabase",
  "TanStack Query",
  "Tailwind CSS",
  "dnd-kit",
];

// Structured data helps search engines understand what the page is about
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: siteConfig.url,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Escaping "<" prevents script injection through the JSON content
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Logo />
          <nav aria-label="Main" className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:pt-28">
          <p className="mx-auto w-fit rounded-full border px-3 py-1 text-xs text-muted-foreground">
            Free &amp; open source portfolio project
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Plan, track, and ship work together.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            {siteConfig.name} is a fast, real-time Kanban board for small teams.
            Organize work into workspaces, collaborate live, and always know
            what&apos;s next.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>

          {/* Decorative board preview (pure HTML/CSS, no image download) */}
          <div
            aria-hidden
            className="mx-auto mt-16 hidden max-w-4xl grid-cols-3 gap-4 rounded-2xl border bg-muted/40 p-4 text-left shadow-sm sm:grid"
          >
            {previewColumns.map((col) => (
              <div
                key={col.label}
                className="space-y-2 rounded-xl bg-muted/60 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className={cn("size-2 rounded-full", col.dot)} />
                  {col.label}
                </div>
                {col.cards.map((card) => (
                  <div
                    key={card}
                    className="rounded-lg border bg-card p-3 text-sm shadow-sm"
                  >
                    {card}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section
          aria-labelledby="features-heading"
          className="border-t bg-muted/30"
        >
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2
              id="features-heading"
              className="text-center text-3xl font-bold tracking-tight"
            >
              Everything your team needs, nothing it doesn&apos;t
            </h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title} className="rounded-xl border bg-card p-6">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tech stack (recruiters scan for this) */}
        <section
          aria-labelledby="stack-heading"
          className="mx-auto max-w-6xl px-4 py-16 text-center"
        >
          <h2
            id="stack-heading"
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Built with
          </h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border px-4 py-1.5 text-sm"
              >
                {tech}
              </li>
            ))}
          </ul>
        </section>

        {/* Final CTA */}
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to get organized?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Set up your first workspace in under a minute.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/signup">Get started for free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            Built by {siteConfig.author} · © {new Date().getFullYear()}{" "}
            {siteConfig.name}
          </p>
          <a
            href={siteConfig.github}
            className="hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
