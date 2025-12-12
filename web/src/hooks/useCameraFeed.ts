"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type CameraState = "idle" | "requesting" | "active" | "denied" | "error";

interface UseCameraFeedResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: CameraState;
  error: string | null;
  retry: () => void;
}

export function useCameraFeed(): UseCameraFeedResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setState("error");
      setError("Camera not supported");
      return;
    }

    setState("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "user" },
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        await videoRef.current.play();
        setState("active");
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setState("denied");
        setError("Camera permission denied");
      } else {
        setState("error");
        setError(err.message || "Failed to access camera");
      }
    }
  }, []);

  const retry = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.display = "none";
    document.body.appendChild(video);
    videoRef.current = video;

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
    };
  }, [startCamera]);

  return { videoRef, state, error, retry };
}
