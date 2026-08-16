"use client";

import {
  ChangeEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type SourceKind = "demo" | "image" | "video";
type Palette =
  | "ice"
  | "ocean"
  | "teal"
  | "emerald"
  | "lime"
  | "amber"
  | "ember"
  | "crimson"
  | "rose"
  | "magenta"
  | "violet"
  | "sunset"
  | "paper"
  | "source";
type Charset = "signal" | "alphabet" | "dots" | "binary";
type FlowDirection = "left" | "right" | "up" | "down";

type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

type Settings = {
  columns: number;
  contrast: number;
  brightness: number;
  fps: number;
  palette: Palette;
  charset: Charset;
  invert: boolean;
  motion: number;
  zoom: number;
  direction: FlowDirection;
};

const CHARSETS: Record<Charset, string> = {
  signal: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+=<>/{}[]",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  dots: ".·∙•",
  binary: "01",
};

const SIGNAL_TAPE =
  " XIRTAM ROSNET ECENQUES MODNAR ETALUCLAC REZIMITPO NOUTER CENEUVIS " +
  "HPARGREPY SREYAL NOTICIDERP FNI TIMIL NESHNOIS EDOM RUTER LE DOM " +
  "MYSA EIRR TAOLF SSOL JSEDOO ETATS LLUN EDOM RRA HPOF LEDOM NRETAP ";

type ColorStop = readonly [number, readonly [number, number, number]];
type GradedPalette = Exclude<Palette, "source">;

const PALETTE_STOPS: Record<GradedPalette, readonly ColorStop[]> = {
  ice: [
    [0, [3, 0, 35]],
    [0.16, [20, 16, 59]],
    [0.38, [53, 108, 151]],
    [0.62, [65, 162, 198]],
    [0.84, [93, 224, 243]],
    [0.96, [255, 255, 255]],
    [1, [255, 255, 255]],
  ],
  ocean: [
    [0, [2, 4, 29]],
    [0.16, [7, 25, 70]],
    [0.38, [13, 70, 112]],
    [0.62, [18, 137, 168]],
    [0.84, [63, 211, 220]],
    [0.96, [225, 253, 255]],
    [1, [255, 255, 255]],
  ],
  teal: [
    [0, [2, 14, 27]],
    [0.16, [4, 56, 67]],
    [0.38, [8, 116, 113]],
    [0.62, [26, 176, 160]],
    [0.84, [103, 239, 203]],
    [0.96, [230, 255, 247]],
    [1, [255, 255, 255]],
  ],
  emerald: [
    [0, [2, 22, 15]],
    [0.16, [7, 59, 39]],
    [0.38, [11, 111, 67]],
    [0.62, [31, 176, 105]],
    [0.84, [113, 238, 162]],
    [0.96, [232, 255, 240]],
    [1, [255, 255, 255]],
  ],
  lime: [
    [0, [11, 19, 4]],
    [0.16, [43, 72, 9]],
    [0.38, [91, 132, 17]],
    [0.62, [155, 198, 39]],
    [0.84, [216, 255, 103]],
    [0.96, [248, 255, 224]],
    [1, [255, 255, 255]],
  ],
  amber: [
    [0, [26, 8, 2]],
    [0.16, [86, 40, 7]],
    [0.38, [164, 86, 15]],
    [0.62, [232, 157, 38]],
    [0.84, [255, 210, 101]],
    [0.96, [255, 247, 222]],
    [1, [255, 255, 255]],
  ],
  ember: [
    [0, [25, 3, 3]],
    [0.16, [87, 17, 7]],
    [0.38, [160, 47, 17]],
    [0.62, [224, 80, 32]],
    [0.84, [255, 151, 74]],
    [0.96, [255, 237, 216]],
    [1, [255, 255, 255]],
  ],
  crimson: [
    [0, [23, 0, 12]],
    [0.16, [79, 5, 29]],
    [0.38, [150, 20, 55]],
    [0.62, [216, 45, 87]],
    [0.84, [255, 116, 142]],
    [0.96, [255, 235, 241]],
    [1, [255, 255, 255]],
  ],
  rose: [
    [0, [24, 4, 20]],
    [0.16, [83, 16, 60]],
    [0.38, [157, 39, 104]],
    [0.62, [225, 84, 156]],
    [0.84, [255, 161, 207]],
    [0.96, [255, 238, 248]],
    [1, [255, 255, 255]],
  ],
  magenta: [
    [0, [22, 0, 30]],
    [0.16, [74, 7, 93]],
    [0.38, [142, 28, 157]],
    [0.62, [207, 67, 199]],
    [0.84, [255, 143, 235]],
    [0.96, [255, 238, 253]],
    [1, [255, 255, 255]],
  ],
  violet: [
    [0, [9, 5, 32]],
    [0.16, [39, 21, 88]],
    [0.38, [80, 49, 157]],
    [0.62, [135, 101, 216]],
    [0.84, [197, 174, 255]],
    [0.96, [244, 239, 255]],
    [1, [255, 255, 255]],
  ],
  sunset: [
    [0, [20, 3, 31]],
    [0.16, [76, 14, 84]],
    [0.38, [157, 40, 102]],
    [0.62, [232, 81, 87]],
    [0.84, [255, 171, 83]],
    [0.96, [255, 239, 191]],
    [1, [255, 255, 255]],
  ],
  paper: [
    [0, [40, 43, 54]],
    [0.16, [72, 76, 86]],
    [0.38, [116, 120, 127]],
    [0.62, [167, 170, 173]],
    [0.84, [220, 220, 216]],
    [0.96, [250, 248, 241]],
    [1, [255, 255, 255]],
  ],
};

const FLOW_LABELS: Record<FlowDirection, string> = {
  left: "Left",
  right: "Right",
  up: "Up",
  down: "Down",
};

const FLOW_ARROWS: Record<FlowDirection, string> = {
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
};

const INITIAL_SETTINGS: Settings = {
  columns: 144,
  contrast: 1.08,
  brightness: 8,
  fps: 24,
  palette: "ice",
  charset: "signal",
  invert: false,
  motion: 72,
  zoom: 1.42,
  direction: "left",
};

const ACCEPTED_TYPES = "image/*,video/mp4,video/webm,video/quicktime";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function wrap(value: number, length: number) {
  return ((value % length) + length) % length;
}

function cellHash(column: number, row: number, phase: number) {
  let value = Math.imul(column + 37, 374761393);
  value = Math.imul(value ^ Math.imul(row + 71, 668265263), 1274126177);
  value = Math.imul(value ^ Math.imul(phase + 101, 2246822519), 3266489917);
  value ^= value >>> 15;
  return value >>> 0;
}

function paletteColor(
  palette: Palette,
  luminance: number,
  red: number,
  green: number,
  blue: number,
) {
  const level = luminance / 255;

  if (palette === "source") {
    const lift = 0.68 + level * 0.72;
    return `rgb(${clamp(Math.round(red * lift), 0, 255)}, ${clamp(
      Math.round(green * lift),
      0,
      255,
    )}, ${clamp(Math.round(blue * lift), 0, 255)})`;
  }

  const stops = PALETTE_STOPS[palette];
  const upperIndex = stops.findIndex(([stop]) => level <= stop);
  const endIndex = upperIndex === -1 ? stops.length - 1 : upperIndex;
  const startIndex = Math.max(0, endIndex - 1);
  const [startStop, startColor] = stops[startIndex];
  const [endStop, endColor] = stops[endIndex];
  const amount =
    startStop === endStop ? 0 : (level - startStop) / (endStop - startStop);
  const mix = (channel: number) =>
    Math.round(
      startColor[channel] +
        (endColor[channel] - startColor[channel]) * clamp(amount, 0, 1),
    );
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}

function paletteGlowColor(palette: Palette) {
  if (palette === "source") return "rgba(255, 255, 255, 0.46)";
  const stops = PALETTE_STOPS[palette];
  const color = stops[Math.max(0, stops.length - 3)][1];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.54)`;
}

export function AsciiStudio() {
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);
  const magnifierPointerRef = useRef<{ x: number; y: number } | null>(null);
  const drawMagnifierRef = useRef<() => void>(() => undefined);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const lastAsciiRef = useRef("");
  const settingsRef = useRef<Settings>(INITIAL_SETTINGS);
  const sourceKindRef = useRef<SourceKind>("demo");

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [sourceKind, setSourceKind] = useState<SourceKind>("demo");
  const [sourceName, setSourceName] = useState("Editorial portrait");
  const [sourceDimensions, setSourceDimensions] = useState("1792 × 1024");
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [message, setMessage] = useState("Demo portrait");

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    sourceKindRef.current = sourceKind;
  }, [sourceKind]);

  const renderAscii = useCallback(
    (
      source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
      width: number,
      height: number,
      time = performance.now(),
    ) => {
      const output = outputCanvasRef.current;
      const sample = sampleCanvasRef.current;
      if (!output || !sample || width <= 0 || height <= 0) return;

      const active = settingsRef.current;
      const columns = active.columns;
      const cellWidth = 8;
      const cellHeight = 8;
      const rows = clamp(
        Math.round(columns * (height / width)),
        12,
        190,
      );
      const sampleContext = sample.getContext("2d", {
        willReadFrequently: true,
      });
      const outputContext = output.getContext("2d");
      if (!sampleContext || !outputContext) return;

      sample.width = columns;
      sample.height = rows;
      sampleContext.clearRect(0, 0, columns, rows);
      const zoom = active.zoom ?? INITIAL_SETTINGS.zoom;
      const cropWidth = width / zoom;
      const cropHeight = height / zoom;
      sampleContext.drawImage(
        source,
        (width - cropWidth) / 2,
        (height - cropHeight) / 2,
        cropWidth,
        cropHeight,
        0,
        0,
        columns,
        rows,
      );

      const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      const scale = Math.min(2, window.devicePixelRatio || 1);
      output.width = Math.round(columns * cellWidth * scale);
      output.height = Math.round(rows * cellHeight * scale);
      output.style.aspectRatio = `${columns * cellWidth} / ${rows * cellHeight}`;

      outputContext.setTransform(scale, 0, 0, scale, 0, 0);
      outputContext.imageSmoothingEnabled = false;
      outputContext.fillStyle = "#030023";
      outputContext.fillRect(0, 0, columns * cellWidth, rows * cellHeight);
      outputContext.font =
        '800 7px "SFMono-Regular", "Cascadia Mono", "Liberation Mono", monospace';
      outputContext.textBaseline = "top";
      outputContext.shadowBlur = 0;
      outputContext.shadowColor = paletteGlowColor(active.palette);

      const charset = CHARSETS[active.charset];
      const lines: string[] = [];
      const timeSeconds = time / 1000;
      const tick = Math.floor((time / 1000) * active.fps);
      const direction = active.direction ?? INITIAL_SETTINGS.direction;
      const verticalVelocity =
        active.motion === 0 ? 0 : 0.5 * (active.motion / 72);
      const verticalDistance = Math.floor(tick * verticalVelocity);
      const verticalShift =
        direction === "up"
          ? verticalDistance
          : direction === "down"
            ? -verticalDistance
            : 0;

      const sampleLuminance = (index: number) => {
        return (
          pixels[index] * 0.2126 +
          pixels[index + 1] * 0.7152 +
          pixels[index + 2] * 0.0722
        );
      };

      for (let row = 0; row < rows; row += 1) {
        let line = "";
        const rowSeed = (cellHash(0, row, 0) % 1000) / 1000;
        const rowVelocity =
          active.motion === 0
            ? 0
            : (0.3 + rowSeed * 0.4) * (active.motion / 72);
        const rowDistance = Math.floor(tick * rowVelocity);
        const horizontalShift =
          direction === "left"
            ? rowDistance
            : direction === "right"
              ? -rowDistance
              : 0;
        for (let column = 0; column < columns; column += 1) {
          const pixelIndex = (row * columns + column) * 4;
          const red = pixels[pixelIndex];
          const green = pixels[pixelIndex + 1];
          const blue = pixels[pixelIndex + 2];
          const alpha = pixels[pixelIndex + 3] / 255;
          let luminance = sampleLuminance(pixelIndex);
          const rightIndex =
            column < columns - 1 ? pixelIndex + 4 : pixelIndex;
          const lowerIndex =
            row < rows - 1 ? pixelIndex + columns * 4 : pixelIndex;
          const edge = Math.max(
            Math.abs(luminance - sampleLuminance(rightIndex)),
            Math.abs(luminance - sampleLuminance(lowerIndex)),
          );
          luminance = (luminance - 128) * active.contrast + 128;
          luminance += active.brightness;
          if (active.invert) luminance = 255 - luminance;
          luminance = clamp((luminance + edge * 0.12) * alpha, 0, 255);
          luminance = 255 * Math.pow(luminance / 255, 0.5);

          const hash = cellHash(column, row, tick);
          const staticHash = cellHash(column, row, 0);
          const streamColumn = column + horizontalShift;
          const streamRow = row + verticalShift;
          const streamHash = cellHash(streamColumn, streamRow, 0);
          const level = luminance / 255;

          let character = " ";
          if (luminance > 18) {
            if (luminance < 58) {
              character = streamHash % 3 === 0 ? "." : " ";
            } else if (luminance < 104) {
              character =
                streamHash % 4 === 0 ? " " : ".·∙"[streamHash % 3];
            } else if (active.charset === "dots") {
              character = charset[streamHash % charset.length];
            } else if (active.charset === "signal") {
              const tapeIndex =
                wrap(streamColumn + streamRow * 19, SIGNAL_TAPE.length);
              character = SIGNAL_TAPE[tapeIndex];
              const occupancy = 84 + level * 14;
              if (streamHash % 100 > occupancy) {
                character = luminance > 178 ? "." : " ";
              }
              if (
                character === " " &&
                luminance > 214 &&
                streamHash % 3 === 0
              ) {
                character = ".";
              }
            } else {
              const dotChance = Math.max(5, Math.round(33 - level * 28));
              character =
                hash % 100 < dotChance
                  ? ".·"[hash % 2]
                  : charset[(hash + staticHash) % charset.length];
            }
          } else if (staticHash % 211 === 0) {
            character = ".";
            luminance = 34;
          }
          line += character;

          if (character !== " ") {
            const isDot = ".·∙•".includes(character);
            const pulseSeed = (streamHash % 1000) / 1000;
            const pulseRate = (2.3 + pulseSeed * 3.1) * (active.motion / 72);
            const dotPulse = isDot
              ? 0.35 +
                0.65 *
                  (0.5 +
                    0.5 *
                      Math.sin(timeSeconds * pulseRate + pulseSeed * Math.PI * 2))
              : 1;
            const drawLuminance = isDot
              ? clamp(luminance + (dotPulse - 0.68) * 60, 0, 255)
              : luminance;
            const drawLevel = drawLuminance / 255;
            const baseAlpha =
              active.palette === "source"
                ? clamp(0.42 + drawLevel * 0.58, 0.42, 1)
                : clamp(0.74 + drawLevel * 0.26, 0.74, 1);
            outputContext.globalAlpha = baseAlpha * dotPulse;
            outputContext.shadowBlur =
              active.palette !== "paper" &&
              active.palette !== "source" &&
              drawLevel > 0.88
                ? 2.4
                : 0;
            outputContext.fillStyle = paletteColor(
              active.palette,
              drawLuminance,
              red,
              green,
              blue,
            );
            outputContext.fillText(
              character,
              column * cellWidth,
              row * cellHeight,
            );
          }
        }
        lines.push(line);
      }

      outputContext.globalAlpha = 1;
      lastAsciiRef.current = lines.join("\n");
      drawMagnifierRef.current();
    },
    [],
  );

  const drawMagnifier = useCallback(() => {
    const pointer = magnifierPointerRef.current;
    const output = outputCanvasRef.current;
    const magnifier = magnifierRef.current;
    const magnifierCanvas = magnifierCanvasRef.current;
    const wrap = magnifier?.parentElement;
    if (!pointer || !output || !magnifier || !magnifierCanvas || !wrap) return;

    const outputBounds = output.getBoundingClientRect();
    const wrapBounds = wrap.getBoundingClientRect();
    if (!outputBounds.width || !outputBounds.height) return;

    const pointerX = outputBounds.left + pointer.x * outputBounds.width;
    const pointerY = outputBounds.top + pointer.y * outputBounds.height;
    magnifier.style.left = `${pointerX - wrapBounds.left}px`;
    magnifier.style.top = `${pointerY - wrapBounds.top}px`;

    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const lensCssSize = 180;
    const lensPixelSize = Math.round(lensCssSize * pixelRatio);
    if (
      magnifierCanvas.width !== lensPixelSize ||
      magnifierCanvas.height !== lensPixelSize
    ) {
      magnifierCanvas.width = lensPixelSize;
      magnifierCanvas.height = lensPixelSize;
    }

    const context = magnifierCanvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, lensPixelSize, lensPixelSize);

    const sourceX = pointer.x * output.width;
    const sourceY = pointer.y * output.height;
    const zoom = 3;
    const sourceWidth = Math.min(
      output.width,
      (lensCssSize / zoom) * (output.width / outputBounds.width),
    );
    const sourceHeight = Math.min(
      output.height,
      (lensCssSize / zoom) * (output.height / outputBounds.height),
    );
    const cropX = clamp(sourceX - sourceWidth / 2, 0, output.width - sourceWidth);
    const cropY = clamp(sourceY - sourceHeight / 2, 0, output.height - sourceHeight);

    context.drawImage(
      output,
      cropX,
      cropY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      lensPixelSize,
      lensPixelSize,
    );
  }, []);

  useEffect(() => {
    drawMagnifierRef.current = drawMagnifier;
    return () => {
      drawMagnifierRef.current = () => undefined;
    };
  }, [drawMagnifier]);

  const drawDemo = useCallback((time: number) => {
    const canvas = demoCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = 640;
    const height = 420;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const seconds = time / 1000;
    context.fillStyle = "#020219";
    context.fillRect(0, 0, width, height);

    const halo = context.createRadialGradient(338, 162, 20, 338, 190, 205);
    halo.addColorStop(0, "rgba(240,250,255,.96)");
    halo.addColorStop(0.28, "rgba(130,205,235,.68)");
    halo.addColorStop(0.62, "rgba(33,80,140,.3)");
    halo.addColorStop(1, "rgba(2,2,25,0)");
    context.fillStyle = halo;
    context.fillRect(80, 0, 520, 400);

    context.save();
    context.translate(338, 180);
    context.rotate(-0.045 + Math.sin(seconds * 0.4) * 0.018);
    context.fillStyle = "rgba(210,235,245,.78)";
    context.beginPath();
    context.ellipse(0, 0, 112, 146, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(2,5,36,.84)";
    context.beginPath();
    context.ellipse(-43, -20, 28, 17, -0.12, 0, Math.PI * 2);
    context.ellipse(45, -20, 28, 17, 0.12, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(12,34,82,.72)";
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(-8, -12);
    context.quadraticCurveTo(-22, 48, 7, 55);
    context.stroke();
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(-36, 88);
    context.quadraticCurveTo(2, 104, 40, 86);
    context.stroke();
    context.restore();

    const shoulder = context.createRadialGradient(340, 455, 0, 340, 455, 310);
    shoulder.addColorStop(0, "rgba(205,235,248,.8)");
    shoulder.addColorStop(0.55, "rgba(62,127,175,.5)");
    shoulder.addColorStop(1, "rgba(3,5,35,0)");
    context.fillStyle = shoulder;
    context.beginPath();
    context.ellipse(340, 455, 285, 150, 0, Math.PI, Math.PI * 2);
    context.fill();

    context.globalCompositeOperation = "screen";
    for (let index = 0; index < 38; index += 1) {
      const y = 18 + index * 10.6;
      const wave = Math.sin(seconds * 1.4 + index * 0.61) * 10;
      const alpha = 0.035 + ((index * 17) % 9) * 0.006;
      context.strokeStyle = `rgba(120,220,255,${alpha})`;
      context.lineWidth = 1;
      context.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const pointY =
          y +
          Math.sin(x * 0.024 + seconds * 1.8 + index) * 3 +
          Math.sin(x * 0.006 + index) * wave;
        if (x === 0) context.moveTo(x, pointY);
        else context.lineTo(x, pointY);
      }
      context.stroke();
    }
    context.globalCompositeOperation = "source-over";

    for (let index = 0; index < 96; index += 1) {
      const x = (index * 83 + Math.sin(seconds + index) * 24 + 640) % 640;
      const y = (index * 47 + Math.cos(seconds * 0.7 + index) * 18 + 420) % 420;
      const pulse = 0.25 + ((Math.sin(seconds * 2 + index) + 1) / 2) * 0.6;
      context.fillStyle = `rgba(185,235,255,${pulse})`;
      context.fillRect(x, y, index % 5 === 0 ? 2 : 1, 1);
    }
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleDemoLoad = () => {
      if (sourceKindRef.current !== "demo") return;
      setSourceName("Editorial portrait");
      setSourceDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
      setMessage("Demo portrait");
      renderAscii(image, image.naturalWidth, image.naturalHeight);
    };

    image.onload = handleDemoLoad;
    image.src = "/demo-portrait.png";
    if (image.complete && image.naturalWidth) handleDemoLoad();

    return () => {
      if (image.onload === handleDemoLoad) image.onload = null;
    };
  }, [renderAscii]);

  useEffect(() => {
    let animationFrame = 0;
    let lastFrame = 0;

    const animate = (time: number) => {
      const frameInterval = 1000 / settingsRef.current.fps;
      if (!isPaused && time - lastFrame >= frameInterval) {
        lastFrame = time;
        if (sourceKind === "demo") {
          const portrait = imageRef.current;
          if (portrait?.complete && portrait.naturalWidth) {
            renderAscii(
              portrait,
              portrait.naturalWidth,
              portrait.naturalHeight,
              time,
            );
          } else {
            drawDemo(time);
            const demo = demoCanvasRef.current;
            if (demo) renderAscii(demo, demo.width, demo.height, time);
          }
        } else if (sourceKind === "image") {
          const image = imageRef.current;
          if (image?.complete && image.naturalWidth) {
            renderAscii(image, image.naturalWidth, image.naturalHeight, time);
          }
        } else if (sourceKind === "video") {
          const video = videoRef.current;
          if (video && video.readyState >= 2) {
            renderAscii(video, video.videoWidth, video.videoHeight, time);
          }
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [drawDemo, isPaused, renderAscii, sourceKind]);

  useEffect(() => {
    if (sourceKind === "image") {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth) {
        renderAscii(image, image.naturalWidth, image.naturalHeight);
      }
    } else if (sourceKind === "demo") {
      const portrait = imageRef.current;
      if (portrait?.complete && portrait.naturalWidth) {
        renderAscii(portrait, portrait.naturalWidth, portrait.naturalHeight);
      }
    } else {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        renderAscii(video, video.videoWidth, video.videoHeight);
      }
    }
  }, [renderAscii, settings, sourceKind]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    },
    [],
  );

  const loadFile = useCallback(
    (file?: File) => {
      if (!file) return;
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setMessage("Choose a JPG, PNG, GIF, MP4, WebM, or MOV file");
        return;
      }

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSourceName(file.name);
      setIsPaused(false);

      if (isImage) {
        const image = imageRef.current;
        if (!image) return;
        image.onload = () => {
          setSourceKind("image");
          setSourceDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
          setMessage("Image ready");
          renderAscii(image, image.naturalWidth, image.naturalHeight);
        };
        image.onerror = () => setMessage("This image could not be decoded");
        image.src = url;
      } else {
        const video = videoRef.current;
        if (!video) return;
        video.onloadedmetadata = () => {
          setSourceKind("video");
          setSourceDimensions(`${video.videoWidth} × ${video.videoHeight}`);
          setMessage("Video playing");
          void video.play().catch(() => setMessage("Press play to start the video"));
        };
        video.onerror = () => setMessage("This video codec is not supported here");
        video.src = url;
        video.load();
      }
    },
    [renderAscii],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    loadFile(event.dataTransfer.files?.[0]);
  };

  const handleMagnifierMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    const output = outputCanvasRef.current;
    if (!output) return;

    const outputBounds = output.getBoundingClientRect();
    const insideCanvas =
      event.clientX >= outputBounds.left &&
      event.clientX <= outputBounds.right &&
      event.clientY >= outputBounds.top &&
      event.clientY <= outputBounds.bottom;

    if (!insideCanvas) {
      magnifierPointerRef.current = null;
      setIsMagnifying(false);
      return;
    }

    magnifierPointerRef.current = {
      x: (event.clientX - outputBounds.left) / outputBounds.width,
      y: (event.clientY - outputBounds.top) / outputBounds.height,
    };
    drawMagnifierRef.current();
    setIsMagnifying(true);
  };

  const updateSetting = <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const togglePlayback = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (sourceKind === "video") {
      const video = videoRef.current;
      if (video) {
        if (nextPaused) video.pause();
        else void video.play();
      }
    }
    setMessage(nextPaused ? "Preview paused" : "Preview playing");
  };

  const resetDemo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    videoRef.current?.pause();
    setSettings(INITIAL_SETTINGS);
    sourceKindRef.current = "demo";
    setSourceKind("demo");
    setSourceName("Editorial portrait");
    const image = imageRef.current;
    if (image) {
      image.onload = () => {
        setSourceDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
        renderAscii(image, image.naturalWidth, image.naturalHeight);
      };
      image.src = "/demo-portrait.png";
    }
    setIsPaused(false);
    setMessage("Demo portrait");
  };

  const copyAscii = async () => {
    try {
      await navigator.clipboard.writeText(lastAsciiRef.current);
      setMessage("ASCII copied to clipboard");
    } catch {
      setMessage("Clipboard access is unavailable");
    }
  };

  const downloadPng = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "raster-tide-ascii.png";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("PNG exported");
    }, "image/png");
  };

  const toggleRecording = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined") {
      setMessage("WEBM recording is not supported in this browser");
      return;
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      return;
    }

    const stream = canvas.captureStream(settings.fps);
    const preferredTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recordedChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) recordedChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: recorder.mimeType || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "raster-tide-ascii.webm";
      anchor.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setMessage("WEBM recording exported");
      stream.getTracks().forEach((track) => track.stop());
    };
    recorderRef.current = recorder;
    recorder.start(500);
    setIsRecording(true);
    setMessage("Recording… press again to finish");
    if (isPaused) togglePlayback();
  };

  const toggleTheme = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    if (root.dataset.themeTransition) return;

    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    const bounds = event.currentTarget.getBoundingClientRect();
    const originX = bounds.left + bounds.width / 2;
    const originY = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );

    root.style.setProperty("--theme-x", `${originX}px`);
    root.style.setProperty("--theme-y", `${originY}px`);
    root.style.setProperty("--theme-radius", `${radius}px`);

    const applyTheme = () => {
      root.dataset.theme = nextTheme;
      try {
        localStorage.setItem("raster-tide-theme", nextTheme);
      } catch {
        // The theme still works when storage is unavailable.
      }
    };

    const transitionDocument = document as ThemeTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!transitionDocument.startViewTransition || prefersReducedMotion) {
      applyTheme();
      return;
    }

    root.dataset.themeTransition = nextTheme;
    const transition = transitionDocument.startViewTransition(applyTheme);
    void transition.finished.finally(() => {
      delete root.dataset.themeTransition;
    });
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="#studio" aria-label="Raster Tide home">
          <span className="wordmark-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="wordmark-copy">
            <b>RASTER</b>
            <em>TIDE</em>
          </span>
        </a>
        <p className="masthead-note">Animated ASCII for images and video</p>
        <div className="masthead-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light and dark mode"
            title="Toggle color theme"
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-moon">◐</span>
              <span className="theme-sun">☼</span>
            </span>
          </button>
          <a className="jump-link" href="#about">
            About <span aria-hidden="true">↘</span>
          </a>
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Animated ASCII generator</p>
          <h1 id="page-title">
            Images and video, <em>redrawn as type.</em>
          </h1>
        </div>
        <div className="intro-copy">
          <p>
            Add a file, then adjust the grid, color, speed, and direction. Save a
            still or record the animation when it looks right.
          </p>
          <span>Files stay on your device.</span>
          <div className="intro-actions">
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              Add a file
            </button>
            <a href="#studio">Try the demo <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section className="studio" id="studio" aria-label="ASCII generator studio">
        <div
          className={`stage ${isDragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <div className="stage-bar">
            <div>
              <span className={`live-dot ${isPaused ? "paused" : ""}`} />
              {isPaused ? "Paused" : "Preview"}
            </div>
            <div className="stage-meta">
              <span>{settings.columns} cols</span>
              <span>
                {settings.motion}% · {FLOW_LABELS[settings.direction ?? "left"]}
              </span>
              <span>{sourceDimensions}</span>
            </div>
          </div>

          <div
            className="canvas-wrap"
            onPointerMove={handleMagnifierMove}
            onPointerLeave={() => {
              magnifierPointerRef.current = null;
              setIsMagnifying(false);
            }}
          >
            <canvas ref={outputCanvasRef} aria-label="Generated ASCII artwork" />
            <div
              ref={magnifierRef}
              className={`magnifier-lens ${isMagnifying ? "is-visible" : ""}`}
              aria-hidden="true"
            >
              <canvas ref={magnifierCanvasRef} />
              <span>3×</span>
            </div>
            {isDragging && (
              <div className="drop-overlay">
                <strong>Drop to open</strong>
                <span>Image or video</span>
              </div>
            )}
          </div>

          <div className="stage-caption">
            <div>
              <span>File</span>
              <strong title={sourceName}>{sourceName}</strong>
            </div>
            <p aria-live="polite">{message}</p>
          </div>
        </div>

        <aside className="controls" aria-label="ASCII controls">
          <div className="control-heading">
            <div>
              <span>01</span>
              <h2>Media</h2>
            </div>
            <button className="text-button" type="button" onClick={resetDemo}>
              Reset example
            </button>
          </div>

          <button
            className="upload-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="upload-plus" aria-hidden="true">+</span>
            <span>
              <strong>Add image or video</strong>
              <small>Drop here or choose a file</small>
            </span>
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
          />

          <div className="control-heading second-heading">
            <div>
              <span>02</span>
              <h2>Style</h2>
            </div>
          </div>

          <label className="range-control">
            <span>
              Density <output>{settings.columns} columns</output>
            </span>
            <input
              type="range"
              min="96"
              max="280"
              value={settings.columns}
              onChange={(event) =>
                updateSetting("columns", Number(event.target.value))
              }
            />
          </label>

          <label className="range-control">
            <span>
              Glyph motion <output>{settings.motion}% drift</output>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.motion}
              onChange={(event) =>
                updateSetting("motion", Number(event.target.value))
              }
            />
          </label>

          <fieldset className="direction-control">
            <legend>Flow direction</legend>
            <div>
              {(Object.keys(FLOW_LABELS) as FlowDirection[]).map((value) => {
                const isActive =
                  (settings.direction ?? INITIAL_SETTINGS.direction) === value;
                return (
                  <button
                    className={isActive ? "active" : ""}
                    type="button"
                    key={value}
                    aria-pressed={isActive}
                    onClick={() => updateSetting("direction", value)}
                  >
                    <span aria-hidden="true">{FLOW_ARROWS[value]}</span>
                    {FLOW_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="range-control">
            <span>
              Frame zoom <output>{(settings.zoom ?? INITIAL_SETTINGS.zoom).toFixed(2)}×</output>
            </span>
            <input
              type="range"
              min="1"
              max="1.6"
              step="0.01"
              value={settings.zoom ?? INITIAL_SETTINGS.zoom}
              onChange={(event) =>
                updateSetting("zoom", Number(event.target.value))
              }
            />
          </label>

          <label className="range-control">
            <span>
              Contrast <output>{settings.contrast.toFixed(2)}</output>
            </span>
            <input
              type="range"
              min="0.55"
              max="2.25"
              step="0.05"
              value={settings.contrast}
              onChange={(event) =>
                updateSetting("contrast", Number(event.target.value))
              }
            />
          </label>

          <label className="range-control">
            <span>
              Exposure <output>{settings.brightness > 0 ? "+" : ""}{settings.brightness}</output>
            </span>
            <input
              type="range"
              min="-70"
              max="70"
              value={settings.brightness}
              onChange={(event) =>
                updateSetting("brightness", Number(event.target.value))
              }
            />
          </label>

          <div className="select-grid">
            <label>
              <span>Character set</span>
              <select
                value={settings.charset}
                onChange={(event) =>
                  updateSetting("charset", event.target.value as Charset)
                }
              >
                <option value="signal">Letters + dots</option>
                <option value="alphabet">Alphabet</option>
                <option value="dots">Dot field</option>
                <option value="binary">Binary 01</option>
              </select>
            </label>
            <label>
              <span>Palette</span>
              <select
                value={settings.palette}
                onChange={(event) =>
                  updateSetting("palette", event.target.value as Palette)
                }
              >
                <optgroup label="Cool">
                  <option value="ice">Ice blue</option>
                  <option value="ocean">Deep ocean</option>
                  <option value="teal">Electric teal</option>
                  <option value="emerald">Emerald green</option>
                  <option value="lime">Acid lime</option>
                </optgroup>
                <optgroup label="Warm">
                  <option value="amber">Amber gold</option>
                  <option value="ember">Hot ember</option>
                  <option value="crimson">Crimson red</option>
                  <option value="rose">Rose pink</option>
                  <option value="sunset">Sunset spectrum</option>
                </optgroup>
                <optgroup label="Electric">
                  <option value="magenta">Neon magenta</option>
                  <option value="violet">Ultraviolet</option>
                </optgroup>
                <optgroup label="Natural">
                  <option value="paper">Paper white</option>
                  <option value="source">Source color</option>
                </optgroup>
              </select>
            </label>
          </div>

          <div className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={settings.invert}
                onChange={(event) => updateSetting("invert", event.target.checked)}
              />
              <span className="switch" aria-hidden="true" />
              Invert light
            </label>
            <label className="fps-control">
              FPS
              <select
                value={settings.fps}
                onChange={(event) => updateSetting("fps", Number(event.target.value))}
              >
                <option value="12">12</option>
                <option value="18">18</option>
                <option value="24">24</option>
                <option value="30">30</option>
              </select>
            </label>
          </div>

          <div className="transport" aria-label="Playback and export controls">
            <button type="button" onClick={togglePlayback}>
              <span aria-hidden="true">{isPaused ? "▶" : "Ⅱ"}</span>
              {isPaused ? "Play" : "Pause"}
            </button>
            <button type="button" onClick={copyAscii}>
              <span aria-hidden="true">Aa</span>
              Copy ASCII
            </button>
          </div>

          <div className="export-row">
            <button type="button" onClick={downloadPng}>
              Export PNG <span aria-hidden="true">↓</span>
            </button>
            <button
              className={isRecording ? "recording" : ""}
              type="button"
              onClick={toggleRecording}
            >
              {isRecording ? "Finish WEBM" : "Record WEBM"}
              <span className="record-dot" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </section>

      <section className="about" id="about">
        <p className="eyebrow">How it works</p>
        <div className="about-grid">
          <h2>A frame becomes a grid. You decide how it moves.</h2>
          <div className="method-list">
            <article>
              <span>1</span>
              <div>
                <h3>Set the grid</h3>
                <p>Choose how much detail the character grid should hold.</p>
              </div>
            </article>
            <article>
              <span>2</span>
              <div>
                <h3>Shape the look</h3>
                <p>Adjust exposure, contrast, color, and the character set.</p>
              </div>
            </article>
            <article>
              <span>3</span>
              <div>
                <h3>Choose the motion</h3>
                <p>Set the speed and send the type left, right, up, or down.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <a className="wordmark footer-wordmark" href="#studio">
          <span className="wordmark-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="wordmark-copy">
            <b>RASTER</b>
            <em>TIDE</em>
          </span>
        </a>
        <p>Files stay on your device.</p>
        <a href="#studio">Back to studio ↑</a>
      </footer>

      <canvas ref={sampleCanvasRef} className="utility-canvas" aria-hidden="true" />
      <canvas ref={demoCanvasRef} className="utility-canvas" aria-hidden="true" />
      <img ref={imageRef} className="utility-canvas" alt="" />
      <video
        ref={videoRef}
        className="utility-canvas"
        muted
        loop
        playsInline
        aria-hidden="true"
      />
    </main>
  );
}
