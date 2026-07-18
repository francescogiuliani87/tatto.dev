import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tact — tell me a story" },
      {
        name: "description",
        content:
          "Tact turns short stories into printable tactile Braille pages for blind and low-vision readers.",
      },
      { property: "og:title", content: "Tact — tell me a story" },
      {
        property: "og:description",
        content:
          "Turn a sentence into Grade 1 Braille and a printable tactile 3D page, entirely in the browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TactApp,
});

function TactApp() {
  return (
    <iframe
      src="/tact/index.html"
      title="Tact"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
