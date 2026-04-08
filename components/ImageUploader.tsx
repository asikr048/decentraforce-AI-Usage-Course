"use client";
import { useRef, useState, useCallback } from "react";
import { Upload, Link, X, Move } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: string; // e.g. "16/9" or "1/1"
}

export default function ImageUploader({ value, onChange, label = "Image", aspectRatio = "16/9" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value.startsWith("http") ? value : "");
  const [draggingOver, setDraggingOver] = useState(false);

  // Focal point drag state
  const previewRef = useRef<HTMLDivElement>(null);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });
  const [draggingFocal, setDraggingFocal] = useState(false);

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all";
  const inputStyle = { background: "hsl(210 60% 6%)", border: "1px solid hsl(185 100% 48% / 0.12)" } as React.CSSProperties;

  // Convert file to base64
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Focal point drag
  const handleFocalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingFocal(true);
    moveFocal(e.clientX, e.clientY);
  };

  const handleFocalMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingFocal) return;
    moveFocal(e.clientX, e.clientY);
  }, [draggingFocal]);

  const moveFocal = (clientX: number, clientY: number) => {
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setFocalPoint({ x, y });
  };

  const hasImage = !!value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-white/35 text-xs uppercase tracking-wider font-syne">{label}</label>
        <div className="flex gap-1">
          {(["upload", "url"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
              style={mode === m
                ? { background: "hsl(185 100% 48% / 0.15)", color: "hsl(185,100%,60%)", border: "1px solid hsl(185 100% 48% / 0.25)" }
                : { background: "transparent", color: "rgba(255,255,255,0.25)", border: "1px solid transparent" }}>
              {m === "upload" ? <Upload size={10} /> : <Link size={10} />}
              {m === "upload" ? "Upload" : "URL"}
            </button>
          ))}
        </div>
      </div>

      {mode === "url" ? (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onChange(urlInput); }}
            placeholder="https://..."
            className={inputCls + " flex-1"}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = "hsl(185 100% 48% / 0.35)")}
            onBlur={e => (e.target.style.borderColor = "hsl(185 100% 48% / 0.12)")}
          />
          <button
            type="button"
            onClick={() => onChange(urlInput)}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "hsl(185 100% 48% / 0.12)", color: "hsl(185,100%,60%)", border: "1px solid hsl(185 100% 48% / 0.2)" }}>
            Apply
          </button>
        </div>
      ) : (
        <div
          onClick={() => !hasImage && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDrop}
          className="relative rounded-xl overflow-hidden transition-all"
          style={{
            aspectRatio,
            border: draggingOver
              ? "2px dashed hsl(185 100% 60%)"
              : hasImage ? "1px solid hsl(185 100% 48% / 0.2)" : "2px dashed hsl(185 100% 48% / 0.2)",
            background: "hsl(210 60% 6%)",
            cursor: hasImage ? "default" : "pointer",
          }}>

          {hasImage ? (
            <>
              {/* Preview with focal point drag */}
              <div
                ref={previewRef}
                className="w-full h-full select-none"
                style={{ cursor: draggingFocal ? "grabbing" : "crosshair" }}
                onMouseDown={handleFocalMouseDown}
                onMouseMove={handleFocalMouseMove}
                onMouseUp={() => setDraggingFocal(false)}
                onMouseLeave={() => setDraggingFocal(false)}>
                <img
                  src={value}
                  alt="preview"
                  draggable={false}
                  className="w-full h-full pointer-events-none"
                  style={{
                    objectFit: "cover",
                    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                  }}
                />

                {/* Focal point crosshair */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${focalPoint.x}%`,
                    top: `${focalPoint.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}>
                  <div className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(2px)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* Overlay controls */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white/70">
                  <Move size={10} />
                  <span>Drag to reposition</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Upload size={9} /> Change
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onChange(""); setUrlInput(""); }}
                  className="p-1 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,100,100,0.8)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,100,100,0.2)" }}>
                  <X size={11} />
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(185 100% 48% / 0.08)", border: "1px solid hsl(185 100% 48% / 0.15)" }}>
                <Upload size={18} style={{ color: "hsl(185,100%,50%)" }} />
              </div>
              <div className="text-center">
                <p className="text-white/50 text-xs font-medium">Click or drag & drop</p>
                <p className="text-white/20 text-[10px] mt-0.5">PNG, JPG, WebP, GIF</p>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>
      )}

      {/* Focal point hint when image is loaded in upload mode */}
      {hasImage && mode === "upload" && (
        <p className="text-white/20 text-[10px] flex items-center gap-1">
          <Move size={9} /> Click & drag on the image to set the focal point
        </p>
      )}
    </div>
  );
}
