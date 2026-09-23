import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { worldOgPlugin } from "./server/worldOgPlugin";
import { apiPlugin } from "./server/vite-plugin";

const SITE_TITLE = "Impeccable Worlds";
const SITE_DESCRIPTION =
  "A browsable catalog of Impeccable design worlds indexed locally. Unofficial and incomplete — not an official Impeccable product.";

function seoUrlsPlugin(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/$/, "");
  const ogImage = origin ? `${origin}/og.png` : "/og.png";
  const pageUrl = origin ? `${origin}/` : "";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
  };
  if (pageUrl) jsonLd.url = pageUrl;

  const safePage = pageUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const safeImage = ogImage.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const canonicalBlock = pageUrl
    ? `<link rel="canonical" href="${safePage}" />\n    <meta property="og:url" content="${safePage}" />`
    : "";
  const jsonLdBlock = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  return {
    name: "seo-urls",
    transformIndexHtml(html) {
      return html
        .replaceAll("%OG_IMAGE%", safeImage)
        .replace("<!--SEO_CANONICAL-->", canonicalBlock)
        .replace("<!--SEO_JSONLD-->", jsonLdBlock);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      react(),
      apiPlugin(),
      seoUrlsPlugin(env.VITE_SITE_URL ?? ""),
      worldOgPlugin({
        siteUrl: env.VITE_SITE_URL ?? "",
        blobBase: env.VITE_BLOB_CARDS_BASE_URL ?? "",
      }),
    ],
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
  };
});
