/** One place for site-wide values used in metadata, OG image, sitemap, and the landing page. */
export const siteConfig = {
  name: "TeamFlow",
  tagline: "Collaborative task management",
  description:
    "Plan, track, and ship work together. Real-time Kanban boards with drag-and-drop, roles, comments, and powerful filters.",
  demo: {
    email: "demo@teamflow-demo.com",
    password: "TeamFlowDemo2025!",
  },
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://team-flow-collaborative-project-and.vercel.app/"),

  author: "Akash Gauda",
  github:
    "https://github.com/gaudakash/TeamFlow-Collaborative-Project-and-Task-Management-App",
};
