/**
 * JSON-LD structured-data builders.
 *
 * Structured data is how search engines, answer engines, and LLMs read the
 * Atelier brand as a real entity. These builders produce schema.org objects
 * ready to drop into a `<script type="application/ld+json">` tag — local
 * business, organization, articles, breadcrumbs, and FAQ (AEO) blocks.
 */
import { BRAND, BUSINESS, SOCIAL_HANDLES } from "./brand";
import type { Article, FaqItem } from "./types";

/** A loosely-typed JSON-LD node. */
export type JsonLd = Record<string, unknown>;

const sameAs = Object.values(SOCIAL_HANDLES);

/** schema.org `PostalAddress` from the business record. */
function postalAddress(): JsonLd {
  return {
    "@type": "PostalAddress",
    streetAddress: BUSINESS.address.streetAddress,
    addressLocality: BUSINESS.address.addressLocality,
    addressRegion: BUSINESS.address.addressRegion,
    postalCode: BUSINESS.address.postalCode,
    addressCountry: BUSINESS.address.addressCountry,
  };
}

/**
 * `LocalBusiness` / `ProfessionalService` schema — the core of local SEO.
 * Emit this once, site-wide (typically in the root layout).
 */
export function localBusinessSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": `${BRAND.url}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    url: BUSINESS.url,
    logo: BUSINESS.logo,
    image: BUSINESS.logo,
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    priceRange: BUSINESS.priceRange,
    foundingDate: BUSINESS.foundingDate,
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    areaServed: BUSINESS.areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    sameAs,
  };
}

/** `Organization` schema — the brand as an entity for knowledge panels. */
export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BRAND.url}/#organization`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: BRAND.url,
    logo: BRAND.logo,
    description: BRAND.elevator,
    slogan: BRAND.tagline,
    sameAs,
  };
}

/** `WebSite` schema with a `SearchAction`, for sitelinks search box. */
export function webSiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BRAND.url}/#website`,
    url: BRAND.url,
    name: BRAND.name,
    description: BRAND.elevator,
    publisher: { "@id": `${BRAND.url}/#organization` },
  };
}

/** `BreadcrumbList` schema from an ordered list of `[name, url]` pairs. */
export function breadcrumbSchema(trail: [string, string][]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, url], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: url.startsWith("http") ? url : `${BRAND.url}${url}`,
    })),
  };
}

/**
 * `FAQPage` schema — the AEO workhorse. Answer engines and LLMs lift these
 * question/answer pairs directly, so every article ships with FAQ schema.
 */
export function faqSchema(faq: FaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** `Article` / `BlogPosting` schema for a weekly article. */
export function articleSchema(article: Article): JsonLd {
  const url = `${BRAND.url}/blog/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}/#article`,
    headline: article.metaTitle,
    description: article.metaDescription,
    url,
    datePublished: article.publishDate,
    dateModified: article.publishDate,
    wordCount: article.wordCount,
    keywords: article.keywords.join(", "),
    author: { "@id": `${BRAND.url}/#organization` },
    publisher: { "@id": `${BRAND.url}/#organization` },
    mainEntityOfPage: url,
    isPartOf: { "@id": `${BRAND.url}/#website` },
  };
}

/** `Service` schema describing the Atelier offering, for service-area SEO. */
export function serviceSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom-home design",
    serviceType: "Residential architectural design",
    description: BRAND.elevator,
    provider: { "@id": `${BRAND.url}/#organization` },
    areaServed: BUSINESS.areaServed,
    url: `${BRAND.url}/builder`,
  };
}

/** Serialize a node (or nodes) for a `<script type="application/ld+json">`. */
export function renderJsonLd(schema: JsonLd | JsonLd[]): string {
  return JSON.stringify(schema);
}
