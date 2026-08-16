"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type SourceKind = "demo" | "image" | "video";
type Palette = "ice" | "paper" | "amber" | "source";
type Charset = "signal" | "alphabet" | "dots" | "binary";

type Settings = {
  columns: number;
  contrast: number;
  brightness: number;
  fps: number;
  palette: Palette;
  charset: Charset;
  invert: boolean;
  motion: number;
};

const CHARSETS: Record<Charset, string> = {
  signal: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+=<>/{}[]",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  dots: ".·∙•",
  binary: "01",
};

const INITIAL_SETTINGS: Settings = {
  columns: 220,
  contrast: 1.48,
  brightness: -8,
  fps: 24,
  palette: "ice",
  charset: "signal",
  invert: false,
  motion: 72,
};

const ACCEPTED_TYPES = "image/*,video/mp4,video/webm,video/quicktime";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

  if (palette === "amber") {
    return `rgb(${Math.round(90 + level * 165)}, ${Math.round(
      45 + level * 155,
    )}, ${Math.round(22 + level * 105)})`;
  }

  if (palette === "paper") {
    const value = Math.round(72 + level * 183);
    return `rgb(${value}, ${value}, ${Math.round(value * 0.96)})`;
  }

  const hue = 229 - level * 43;
  const light = 19 + level * 63;
  return `hsl(${hue} 100% ${light}%)`;
}

export function AsciiStudio() {
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
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

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [sourceKind, setSourceKind] = useState<SourceKind>("demo");
  const [sourceName, setSourceName] = useState("Procedural signal");
  const [sourceDimensions, setSourceDimensions] = useState("640 × 420");
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("Live demo running");

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

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
      const cellWidth = 5.15;
      const cellHeight = 7.4;
      const rows = clamp(
        Math.round(columns * (height / width) * (cellWidth / cellHeight)),
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
      sampleContext.drawImage(source, 0, 0, columns, rows);

      const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      const scale = Math.min(1.45, window.devicePixelRatio || 1);
      output.width = Math.round(columns * cellWidth * scale);
      output.height = Math.round(rows * cellHeight * scale);
      output.style.aspectRatio = `${columns * cellWidth} / ${rows * cellHeight}`;

      outputContext.setTransform(scale, 0, 0, scale, 0, 0);
      outputContext.fillStyle = "#02012c";
      outputContext.fillRect(0, 0, columns * cellWidth, rows * cellHeight);
      outputContext.font =
        '700 7px "SFMono-Regular", "Cascadia Mono", "Liberation Mono", monospace';
      outputContext.textBaseline = "top";
      outputContext.shadowBlur = active.palette === "ice" ? 4 : 0;
      outputContext.shadowColor = "rgba(58, 211, 255, 0.48)";

      const charset = CHARSETS[active.charset];
      const lines: string[] = [];
      const motionRate =
        active.motion === 0 ? 0 : 1.2 + (active.motion / 100) * 10;
      const phase = Math.floor((time / 1000) * motionRate);
      const shimmer = active.motion / 100;

      const sampleLuminance = (index: number) => {
        return (
          pixels[index] * 0.2126 +
          pixels[index + 1] * 0.7152 +
          pixels[index + 2] * 0.0722
        );
      };

      for (let row = 0; row < rows; row += 1) {
        let line = "";
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
          luminance = clamp((luminance * 0.88 + edge * 0.9) * alpha, 0, 255);

          const hash = cellHash(column, row, phase);
          const staticHash = cellHash(column, row, 0);
          const level = luminance / 255;
          const drift = ((hash % 1000) / 1000 - 0.5) * 20 * shimmer;
          luminance = clamp(luminance + drift, 0, 255);

          let character = " ";
          if (luminance > 22) {
            if (luminance < 72) {
              character = hash % 5 === 0 ? "." : " ";
            } else if (luminance < 125) {
              character = hash % 4 === 0 ? " " : ".·∙"[hash % 3];
            } else if (active.charset === "dots") {
              character = charset[hash % charset.length];
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
            outputContext.globalAlpha = clamp(0.16 + level * 1.08, 0.16, 1);
            outputContext.fillStyle = paletteColor(
              active.palette,
              luminance,
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
    },
    [],
  );

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
    let animationFrame = 0;
    let lastFrame = 0;

    const animate = (time: number) => {
      const frameInterval = 1000 / settingsRef.current.fps;
      if (!isPaused && time - lastFrame >= frameInterval) {
        lastFrame = time;
        if (sourceKind === "demo") {
          drawDemo(time);
          const demo = demoCanvasRef.current;
          if (demo) renderAscii(demo, demo.width, demo.height, time);
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
      const demo = demoCanvasRef.current;
      if (demo?.width) renderAscii(demo, demo.width, demo.height);
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
        setMessage("Choose an image, MP4, WebM, or MOV file");
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
          setMessage("Image alive — glyphs are drifting locally");
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
          setMessage("Video playing — press Record WEBM to export");
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
    setMessage(nextPaused ? "Output paused" : "Output playing");
  };

  const resetDemo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    videoRef.current?.pause();
    setSettings(INITIAL_SETTINGS);
    setSourceKind("demo");
    setSourceName("Procedural signal");
    setSourceDimensions("640 × 420");
    setIsPaused(false);
    setMessage("Live demo running");
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
      anchor.download = "glyphfield-ascii.png";
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
      anchor.download = "glyphfield-ascii.webm";
      anchor.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setMessage("WEBM recording exported");
      stream.getTracks().forEach((track) => track.stop());
    };
    recorderRef.current = recorder;
    recorder.start(500);
    setIsRecording(true);
    setMessage("Recording ASCII output… press again to finish");
    if (isPaused) togglePlayback();
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="#studio" aria-label="Glyphfield home">
          <span className="wordmark-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          GLYPH<span>FIELD</span>
        </a>
        <p className="masthead-note">A browser-native ASCII laboratory</p>
        <a className="jump-link" href="#about">
          How it works <span aria-hidden="true">↘</span>
        </a>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">A living typographic field</p>
          <h1 id="page-title">
            Any frame. <em>Alive in blue.</em>
          </h1>
        </div>
        <div className="intro-copy">
          <p>
            Drop a photo or film. Its light becomes a restless field of letters,
            symbols, and electric-blue dots.
          </p>
          <span>Private by design — files stay on this device.</span>
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
              {isPaused ? "Paused" : "Live output"}
            </div>
            <div className="stage-meta">
              <span>{settings.columns} cols</span>
              <span>{settings.motion}% drift</span>
              <span>{sourceDimensions}</span>
            </div>
          </div>

          <div className="canvas-wrap">
            <canvas ref={outputCanvasRef} aria-label="Generated ASCII artwork" />
            {isDragging && (
              <div className="drop-overlay">
                <strong>Release the frame</strong>
                <span>Image or video</span>
              </div>
            )}
          </div>

          <div className="stage-caption">
            <div>
              <span>Source</span>
              <strong title={sourceName}>{sourceName}</strong>
            </div>
            <p aria-live="polite">{message}</p>
          </div>
        </div>

        <aside className="controls" aria-label="ASCII controls">
          <div className="control-heading">
            <div>
              <span>01</span>
              <h2>Source</h2>
            </div>
            <button className="text-button" type="button" onClick={resetDemo}>
              Reset demo
            </button>
          </div>

          <button
            className="upload-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="upload-plus" aria-hidden="true">+</span>
            <span>
              <strong>Choose a file</strong>
              <small>JPG, PNG, GIF, MP4, WebM or MOV</small>
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
              <h2>Translate</h2>
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
                <option value="signal">Signal mix</option>
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
                <option value="ice">Ice blue</option>
                <option value="paper">Paper white</option>
                <option value="amber">Amber</option>
                <option value="source">Source color</option>
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
        <p className="eyebrow">Light, sampled into language</p>
        <div className="about-grid">
          <h2>Every pixel has a brightness. Every brightness can become a glyph.</h2>
          <div className="method-list">
            <article>
              <span>1</span>
              <div>
                <h3>Sample</h3>
                <p>The source frame is scaled to your chosen character grid.</p>
              </div>
            </article>
            <article>
              <span>2</span>
              <div>
                <h3>Map</h3>
                <p>Each cell’s luminance selects a character from light to dense.</p>
              </div>
            </article>
            <article>
              <span>3</span>
              <div>
                <h3>Render</h3>
                <p>The type is redrawn on every video frame, ready to save or record.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <a className="wordmark footer-wordmark" href="#studio">
          GLYPH<span>FIELD</span>
        </a>
        <p>Your media stays in your browser. Nothing is uploaded.</p>
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
