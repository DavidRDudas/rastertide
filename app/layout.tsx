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
    title: "Glyphfield — Image + Video to ASCII",
    description:
      "Turn any image or video into luminous, animated ASCII art directly in your browser.",
    openGraph: {
      title: "Glyphfield",
      description: "Image + video → ASCII",
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
      description: "Image + video → ASCII",
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
