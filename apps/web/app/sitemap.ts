import type { MetadataRoute } from "next";
import { ARTICLES } from "../lib/copy/articles";
import { PROGRAMMES } from "../lib/copy/programmes";

const BASE = "https://preventos.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/learn", "/tools/savings-calculator", "/tools/sleep-debt"];
  return [
    ...staticPaths.map((path) => ({ url: `${BASE}${path}` })),
    ...PROGRAMMES.map((programme) => ({ url: `${BASE}/${programme.slug}` })),
    ...ARTICLES.map((article) => ({ url: `${BASE}/learn/${article.slug}` })),
  ];
}
