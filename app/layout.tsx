import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const themeBootScript = `
  (() => {
    try {
      const saved = localStorage.getItem("raster-tide-theme");
      const preferred = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      document.documentElement.dataset.theme =
        saved === "dark" || saved === "light" ? saved : preferred;
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  })();
`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Raster Tide — Animated ASCII Generator",
    description:
      "Convert images and video into animated ASCII art, then export a PNG or WEBM.",
    icons: {
      icon: { url: "/favicon.png", type: "image/png" },
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    openGraph: {
      title: "Raster Tide",
      description: "Animated ASCII for images and video",
      type: "website",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1536,
          height: 915,
          alt: "Raster Tide animated ASCII portrait",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Raster Tide",
      description: "Animated ASCII for images and video",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
