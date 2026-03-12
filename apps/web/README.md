# apps/web

Next.js App Router website for Luthor marketing, demo, and documentation.

## What this app includes

1. SEO-focused landing page at `/` with:
   - Structured data (`SoftwareApplication`, `SoftwareSourceCode`, `WebSite`, `Organization`, `FAQPage`)
   - Live package credibility metrics from npm + GitHub APIs
   - Crawlable semantic content and canonical metadata
2. Live demo page at `/demo/` using the extensive editor preset.
3. Markdown documentation pages under `/docs/**` rendered from:
   - `src/content/docs/**/*.md`
4. Generated sitemap at `/sitemap.xml`.
5. LLM discovery artifacts in `public/llms.txt` and `public/llms-full.txt`.

## Scripts

- `npm run sync:docs`: index docs from `src/content/docs/` and regenerate `src/data/docs-index.generated.ts`.
- `npm run sync:llms`: regenerate `public/llms.txt` and `public/llms-full.txt`.
- `npm run sync:content`: run both sync jobs in order.
- `npm run dev`: sync docs/LLM content, then run Next dev server.
- `npm run build`: sync docs/LLM content, then run Next production build.
- `npm run start`: run the built Next.js server.
- `npm run preview`: preview Cloudflare/OpenNext output with Wrangler.

## Notes

- Tailwind is intentionally not used in this app.
- Documentation is statically generated and indexable by crawlers and bots.
- Docs search is local and supports searching props, methods, command IDs, and code snippets.
