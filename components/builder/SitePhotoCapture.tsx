"use client";

/**
 * SitePhotoCapture — capture a photo of the real site.
 *
 * Atelier's north star: a contractor snaps a photo of a site and the design is
 * brought to life on that real photo. This component is the *front* of that
 * pipeline — the capture surface.
 *
 * Two paths, one component:
 *  - Live camera via `navigator.mediaDevices.getUserMedia` (rear camera
 *    preferred with `facingMode: "environment"`) — the phone-in-the-field path.
 *  - File upload + drag-and-drop fallback — desktop, or when the camera is
 *    denied / unavailable.
 *
 * Keyless: the photo never leaves the browser. The parent owns persistence
 * (best-effort IndexedDB via `lib/site-photo.ts`); this component just emits
 * the captured image data.
 *
 * Accessibility: every camera permission state has clear messaging, all
 * controls are keyboard-operable, and motion respects `prefers-reduced-motion`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  ImageUp,
  Loader2,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { fileToSitePhotoData } from "@/lib/site-photo";

/** The shape emitted to the parent when a photo is captured. */
export interface CapturedPhoto {
  dataUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  source: "camera" | "upload";
}

interface SitePhotoCaptureProps {
  /** Currently held photo (controlled), or null when none. */
  value: CapturedPhoto | null;
  /** Emitted when a photo is captured or replaced. */
  onCapture: (photo: CapturedPhoto) => void;
  /** Emitted when the held photo is removed. */
  onRemove: () => void;
  /** Disables all controls (e.g. while the parent is busy). */
  disabled?: boolean;
  className?: string;
}

/** Camera lifecycle, distinct from "do we have a photo". */
type CameraState =
  | "idle" // camera not started; upload/drop available
  | "requesting" // awaiting the getUserMedia permission prompt
  | "live" // stream attached, framing the shot
  | "denied" // permission denied — upload fallback only
  | "unavailable"; // no camera API / no device — upload fallback only

const EASE = [0.16, 1, 0.3, 1] as const;

export function SitePhotoCapture({
  value,
  onCapture,
  onRemove,
  disabled = false,
  className,
}: SitePhotoCaptureProps) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [camera, setCamera] = useState<CameraState>("idle");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Stop and release any active camera stream. */
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Release the camera on unmount — a live stream must never leak.
  useEffect(() => stopStream, [stopStream]);

  // Detect a missing camera API up front so the UI can lead with upload.
  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";
    if (!supported) setCamera("unavailable");
  }, []);

  /** Request the rear camera and attach the stream to the <video>. */
  const startCamera = useCallback(async () => {
    if (disabled) return;
    setError(null);
    setCamera("requesting");
    track("site_photo_camera_requested");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCamera("live");
      // The <video> mounts with `camera === "live"`; attach on the next tick.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            /* autoplay can reject; the stream is still visible */
          });
        }
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCamera("denied");
        setError(
          "Camera access was blocked. You can allow it in your browser settings, or upload a photo instead.",
        );
        track("site_photo_camera_denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setCamera("unavailable");
        setError(
          "No camera was found on this device — upload a photo of the site instead.",
        );
      } else {
        setCamera("idle");
        setError(
          "The camera couldn't be started. Upload a photo of the site instead.",
        );
      }
    }
  }, [disabled]);

  /** Cancel a live camera session without capturing. */
  const cancelCamera = useCallback(() => {
    stopStream();
    setCamera("idle");
  }, [stopStream]);

  /** Grab the current video frame into a JPEG and emit it. */
  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Couldn't capture the frame — try uploading a photo instead.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopStream();
    setCamera("idle");
    setError(null);
    track("site_photo_captured", { source: "camera" });
    onCapture({
      dataUrl,
      mimeType: "image/jpeg",
      width: canvas.width,
      height: canvas.height,
      source: "camera",
    });
  }, [onCapture, stopStream]);

  /** Ingest a chosen / dropped file into a downscaled photo. */
  const ingestFile = useCallback(
    async (file: File) => {
      if (disabled) return;
      if (!file.type.startsWith("image/")) {
        setError("That file isn't an image — choose a photo of the site.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const data = await fileToSitePhotoData(file);
        track("site_photo_captured", { source: "upload" });
        onCapture({ ...data, source: "upload" });
      } catch {
        setError("That image couldn't be read — try another photo.");
      } finally {
        setBusy(false);
      }
    },
    [disabled, onCapture],
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void ingestFile(file);
      // Reset so picking the same file again still fires `change`.
      e.target.value = "";
    },
    [ingestFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void ingestFile(file);
    },
    [ingestFile],
  );

  const transition = reduce ? { duration: 0 } : { duration: 0.4, ease: EASE };

  /* ---- Preview: a photo is held ----------------------------------------- */
  if (value) {
    return (
      <div className={cn("rounded-card border border-border bg-surface p-4", className)}>
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transition}
          className="relative overflow-hidden rounded-lg border border-border bg-ink"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.dataUrl}
            alt="Captured site photo"
            className="block max-h-[22rem] w-full object-contain"
          />
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full border border-border-bright bg-ink/80 px-2.5 py-1 text-xs text-foreground backdrop-blur">
            <Camera className="size-3.5 text-copper" />
            Site photo · {value.source === "camera" ? "camera" : "upload"}
          </div>
        </motion.div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="subtle"
            size="sm"
            disabled={disabled}
            onClick={() => {
              setError(null);
              const supported =
                !!navigator.mediaDevices &&
                typeof navigator.mediaDevices.getUserMedia === "function";
              if (supported && camera !== "denied") void startCamera();
              else fileInputRef.current?.click();
            }}
            className="flex-1"
          >
            <RotateCcw className="size-4" /> Retake
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              track("site_photo_removed");
              onRemove();
            }}
            className="flex-1"
          >
            <Trash2 className="size-4" /> Remove
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFileInput}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    );
  }

  /* ---- Live camera ------------------------------------------------------- */
  if (camera === "live") {
    return (
      <div className={cn("rounded-card border border-border bg-surface p-4", className)}>
        <div className="relative overflow-hidden rounded-lg border border-border bg-ink">
          <video
            ref={videoRef}
            playsInline
            muted
            className="block max-h-[22rem] w-full object-contain"
            aria-label="Live camera preview of the site"
          />
          <button
            type="button"
            onClick={cancelCamera}
            aria-label="Close camera"
            className="absolute right-2 top-2 grid size-9 place-items-center rounded-full border border-border-bright bg-ink/80 text-foreground backdrop-blur transition-colors hover:text-copper-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={takePhoto} disabled={disabled} className="flex-[2]">
            <Camera className="size-4" /> Take photo
          </Button>
          <Button
            variant="subtle"
            onClick={cancelCamera}
            disabled={disabled}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  /* ---- Idle: camera CTA + upload / drag-drop fallback ------------------- */
  const cameraSupported = camera !== "unavailable";
  const cameraBlocked = camera === "denied";

  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-4 transition-colors",
        dragging ? "border-copper bg-copper/5" : "border-border",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (!disabled && !busy) onDrop(e);
        else e.preventDefault();
      }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-copper/15 text-copper">
          <Camera className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base tracking-tight text-foreground">
            Snap a photo of the site
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-2">
            Standing in the yard? Capture the site directly — the design will be
            rendered onto your real photo.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {cameraSupported && !cameraBlocked && (
          <Button
            onClick={() => void startCamera()}
            disabled={disabled || camera === "requesting"}
            size="lg"
            className="sm:flex-1"
          >
            {camera === "requesting" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Starting camera…
              </>
            ) : (
              <>
                <Camera className="size-4" /> Use camera
              </>
            )}
          </Button>
        )}
        <Button
          variant={cameraSupported && !cameraBlocked ? "subtle" : "primary"}
          size="lg"
          disabled={disabled || busy}
          onClick={() => fileInputRef.current?.click()}
          className="sm:flex-1"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Reading photo…
            </>
          ) : (
            <>
              <ImageUp className="size-4" /> Upload a photo
            </>
          )}
        </Button>
      </div>

      <p className="mt-2 text-center text-xs text-muted-2 sm:text-left">
        {dragging
          ? "Drop the photo to use it"
          : "Or drag a photo here · JPG or PNG"}
      </p>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={transition}
            role="alert"
            className="mt-3 flex items-start gap-1.5 text-xs text-copper-bright"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileInput}
        aria-label="Upload a photo of the site"
      />
    </div>
  );
}
