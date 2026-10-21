/** One place for site-wide values used in metadata, OG image, sitemap, and the landing page. */
export const siteConfig = {
  name: "TeamFlow",
  tagline: "Collaborative task management",
  description:
    "Plan, track, and ship work together. Real-time Kanban boards with drag-and-drop, roles, comments, and powerful filters.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  // 👇 Replace with your real details
  author: "Your Name",
  github: "https://github.com/YOUR_USERNAME/teamflow",
};
