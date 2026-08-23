import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// MediaPipe face landmark indices (468-point model key points)
const NOSE = 1;
const FOREHEAD = 10;
const LEFT_EDGE = 234; // left cheek / ear zone
const RIGHT_EDGE = 454; // right cheek / ear zone
const LE_TOP = 159;
const LE_BOT = 145;
const LE_INNER = 133;
const LE_OUTER = 33;
const RE_TOP = 386;
const RE_BOT = 374;
const RE_INNER = 362;
const RE_OUTER = 263;
const M_LEFT = 61;
const M_RIGHT = 291;
const M_TOP = 13;
const M_BOT = 14;

export interface FacePose {
  yaw: number; // -1..1
  pitch: number; // -1..1
  roll: number; // -1..1
  blink: number; // 0..1, 1 = fully closed
  mouth: number; // 0..1 open amount
}

function d(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Eye aspect ratio; smaller = more closed. */
function ear(f: NormalizedLandmark[], top: number, bot: number, inner: number, outer: number) {
  const v = d(f[top], f[bot]);
  const h = d(f[inner], f[outer]);
  return h > 1e-4 ? v / h : 0.3;
}

function estimatePose(f: NormalizedLandmark[]): FacePose {
  const width = Math.max(d(f[LEFT_EDGE], f[RIGHT_EDGE]), 1e-4);

  // Yaw: horizontal offset of nose vs face-center line.
  const midX = (f[LEFT_EDGE].x + f[RIGHT_EDGE].x) / 2;
  const yaw = (f[NOSE].x - midX) / width;

  // Pitch: vertical offset of nose vs the forehead-edge line.
  const midY = (f[FOREHEAD].y + (f[LEFT_EDGE].y + f[RIGHT_EDGE].y) / 2) / 2;
  const pitch = (f[NOSE].y - midY) / width;

  // Roll: tilt of the line between the two cheek/ear landmarks.
  const roll = Math.atan2(
    f[LEFT_EDGE].y - f[RIGHT_EDGE].y,
    f[LEFT_EDGE].x - f[RIGHT_EDGE].x,
  );

  // Blink from eye aspect ratios (1 - normalized closed).
  const ler = ear(f, LE_TOP, LE_BOT, LE_INNER, LE_OUTER);
  const rer = ear(f, RE_TOP, RE_BOT, RE_INNER, RE_OUTER);
  const blink = Math.max(0, Math.min(1, 1 - (ler + rer) / 0.6));

  // Mouth vertical opening ratio.
  const mouthH = d(f[M_TOP], f[M_BOT]);
  const mouthW = d(f[M_LEFT], f[M_RIGHT]);
  const mouth = Math.max(0, Math.min(1, (mouthH / Math.max(mouthW, 1e-4)) * 4));

  return {
    yaw: Math.max(-1, Math.min(1, yaw * 3)),
    pitch: Math.max(-1, Math.min(1, pitch * 3)),
    roll: Math.max(-1, Math.min(1, roll / 0.5)),
    blink,
    mouth,
  };
}

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/**
 * On-device face tracking via MediaPipe FaceLandmarker.
 * The camera frame is processed locally and never leaves the device.
 */
export function useFaceTracking() {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTime = useRef(-1);

  const [running, setRunning] = useState(false);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const poseRef = useRef<FacePose>({ yaw: 0, pitch: 0, roll: 0, blink: 0, mouth: 0 });
  const blendsRef = useRef<Record<string, number>>({});

  const loop = useCallback(() => {
    const video = videoEl;
    const landmarker = landmarkerRef.current;
    if (video && landmarker && video.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = video.currentTime;
      const res = landmarker.detectForVideo(video, performance.now());
      if (res.faceLandmarks && res.faceLandmarks.length > 0) {
        poseRef.current = estimatePose(res.faceLandmarks[0]);
      }
      if (res.faceBlendshapes && res.faceBlendshapes.length > 0) {
        const next: Record<string, number> = {};
        for (const cat of res.faceBlendshapes[0].categories) {
          next[cat.categoryName] = cat.score;
        }
        blendsRef.current = next;
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [videoEl]);

  const start = useCallback(async () => {
    if (running) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    streamRef.current = stream;
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    await video.play();
    setVideoEl(video);

    const fileset = await FilesetResolver.forVisionTasks("/wasm");
    const landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
    landmarkerRef.current = landmarker;
    setRunning(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, running]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setVideoEl(null);
    lastVideoTime.current = -1;
    poseRef.current = { yaw: 0, pitch: 0, roll: 0, blink: 0, mouth: 0 };
    blendsRef.current = {};
    setRunning(false);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    running,
    pose: poseRef,
    blends: blendsRef,
    video: videoEl,
    start,
    stop,
  };
}