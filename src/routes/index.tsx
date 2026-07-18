import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: async () => {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const filePath = path.join(process.cwd(), "public", "tact", "index.html");
        let html = await fs.readFile(filePath, "utf-8");
        // Rewrite relative asset paths so they resolve at site root.
        html = html
          .replace(/(['"`])shapes\//g, "$1/tact/shapes/")
          .replace(/(['"`])assets\//g, "$1/tact/assets/");
        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
  component: () => null,
});
