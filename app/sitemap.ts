import type { MetadataRoute } from "next";
import { STYLES } from "@/lib/design";

const siteUrl = "https://atelier.design";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/builder`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/builder/brief`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/builder/floor-plan`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/match`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/gc-network`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/partner/dashboard`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const showcaseRoutes: MetadataRoute.Sitemap = STYLES.map((style) => ({
    url: `${siteUrl}/showcase/${style.id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...showcaseRoutes];
}
