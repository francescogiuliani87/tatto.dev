import { createFileRoute } from "@tanstack/react-router";
// Inline the static Tact HTML at build time so it can be served directly at "/"
// without a redirect and without exposing the /tact/ folder in the URL.
// Asset URLs inside the HTML remain absolute (/tact/...) and continue to be
// served as static files from public/tact/.
import tactHtml from "../../public/tact/index.html?raw";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: () =>
        new Response(tactHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",

          },
        }),
    },
  },
  component: () => null,
});
