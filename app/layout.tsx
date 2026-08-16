import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

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
    title: "Glyphfield — Animated ASCII Generator",
    description:
      "Convert images and video into animated ASCII art, then export a PNG or WEBM.",
    openGraph: {
      title: "Glyphfield",
      description: "Animated ASCII for images and video",
      type: "website",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1536,
          height: 915,
          alt: "Glyphfield ASCII portrait",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Glyphfield",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
