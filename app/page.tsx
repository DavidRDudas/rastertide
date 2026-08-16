import type { Metadata } from "next";
import { AsciiStudio } from "./AsciiStudio";

export const metadata: Metadata = {
  title: "Raster Tide — Animated ASCII Generator",
  description:
    "Convert images and video into animated ASCII art, then export a PNG or WEBM.",
};

export default function Home() {
  return <AsciiStudio />;
}
