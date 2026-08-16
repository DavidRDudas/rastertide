import type { Metadata } from "next";
import { AsciiStudio } from "./AsciiStudio";

export const metadata: Metadata = {
  title: "Glyphfield — Image + Video to ASCII",
  description:
    "Turn any image or video into luminous, animated ASCII art directly in your browser.",
};

export default function Home() {
  return <AsciiStudio />;
}
