import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "../../../lib/copy/articles";

interface Params {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.description };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="section">
      <div className="container prose">
        <h1>{article.title}</h1>
        {article.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
        {article.relatedTool ? (
          <p>
            <a className="button button-quiet" href={article.relatedTool.href}>
              {article.relatedTool.label}
            </a>
          </p>
        ) : null}
        <p>
          <a href="/learn">← All guides</a>
        </p>
      </div>
    </article>
  );
}
