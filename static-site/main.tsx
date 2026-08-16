import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AsciiStudio } from "../app/AsciiStudio";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Raster Tide could not find its application root.");
}

createRoot(root).render(
  <StrictMode>
    <AsciiStudio />
  </StrictMode>,
);
