# avatar-meet — Session Handoff

> Written for the next opencode session to resume exactly where the last one stopped.
> Session in scope: "Avatar-based video tool for disabled users" (original brainstorm was session `ses_0257d4f13ffecc2x6sfL2jVNo4`).

---

## TL;DR — what this project is

A **Zoom-like meeting tool where everyone appears as a realistic avatar**, built for
people with disabilities who don't want to reveal themselves on camera.

**Core promise (product pitch):** "Everyone gets a face. Only they decide what it is."
Avatar-by-default, **mic optional**, **camera optional**, web-based. The camera feed is
processed **on-device only** and never sent — that privacy guarantee is the differentiator.

---

## Current status: WORKING & BUILT CLEANLY

- `npm run build` → **zero TypeScript errors**, dist builds.
- Dev server currently **running on http://localhost:5173/** (was verified returning 200).
- Feature set implemented:
  1. Join a room, pick an avatar look (6 presets), see your avatar + remote avatars.
  2. Agora voice (RTM for presence/avatar sync, RTC for mic) — camera & mic both optional.
  3. **Camera face-mapping (on-device MediaPipe)** — tracks your head (yaw/pitch/roll) and all
     **52 ARKit facial blendshapes** and drives a realistic Ready Player Me avatar's morph
     targets so it **mimics your expressions** in real time. Local-only preview tile shown.
  4. Gesture buttons (Idle/Wave/Nod/Happy) were **removed** per user request.

---

## Stack / architecture

- **Vite + React + TypeScript + zustand**
- **Three.js + @react-three/fiber** (via `@react-three/fiber` package; three-three fiber v8)
- **Agora RTM SDK** (`agora-rtm-sdk@2.2.4`) — presence + avatar state sync
- **Agora RTC SDK** (`agora-rtc-sdk-ng@4.23.0`) — voice (mic optional)
- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision@1.0.1`) — on-device face tracking + blendshapes
- **Ready Player Me avatar GLB** (realistic) — `public/avatar.glb` (2.5 MB) with full 52 ARKit morph targets on `Wolf3D_Head`, `EyeLeft`, `EyeRight`, `Wolf3D_Teeth` (names in `mesh.extras.targetNames`).
- **Node.js** installed at user-local path: `C:\Users\balaji\node\node-v22.14.0-win-x64` (NOT on system PATH).

### Key source files (`C:\Users\balaji\avatar-meet\`)
- `src/useFaceTracking.ts` — MediaPipe hook; exposes `pose` (head) + `blends` (52 ARKit) refs, `start/stop`, `video`. Reads `outputFaceBlendshapes: true`. WASM loads from `/wasm`; model from MediaPipe CDN.
- `src/avatar/AvatarModel.tsx` — loads `/avatar.glb`, drives head bone from pose + morph targets from blends. Mic-only fallback animates `jawOpen`.
- `src/avatar/AvatarCanvas.tsx` — per-tile Canvas; receives `pose`/`blends` refs.
- `src/avatar/presets.ts` — 6 `Look` presets (hair/top/skin colors). Outfit is tinted to `look.top` in `AvatarModel`.
- `src/agora/rtm.ts` — RTM 2.x new API (`new RTM(appId, uid)`, `login`, `subscribe`, `publish`, `message` event). `joinRtm` returns handlers incl. `sendState`, `leave`.
- `src/agora/rtc.ts` — Agora RTC voice, mic muted by default, `enableMic`, `speechLevel`.
- `src/components/MeetingRoom.tsx` — join flow, Mic + Camera toggles, local video preview tile.
- `src/components/IdentityPicker.tsx` — join screen + avatar look picker.
- `src/store.ts` + `src/shared/types.ts` — zustand room store. `AvatarState = { lookId, talking, mode }` (gesture removed). `PresenceMode = "text" | "voice" | "camera"`.

### Public assets
- `public/avatar.glb` (2.5 MB)
- `public/wasm/*` — MediaPipe wasm files (self-hosted, ~23 MB)
- `public/.env` (created; **Agora App ID is SET**)

---

## Environment / runtime notes (IMPORTANT)

1. **Disk space is CRITICAL**: `C:` has only **~0.13 GB free** as of handoff. Install anything
   new only if essential, and clean `node_modules/`/temp/Dist logs first. Adding MediaPipe wasm
   (~23 MB) + avatar (2.5 MB) used the free space. **Do not run heavy `npm install`s** blindly.
2. **Node is NOT on PATH.** Each new shell must prepend it:
   `$env:Path = "C:\Users\balaji\node\node-v22.14.0-win-x64;" + $env:Path`
   Run with full path: `& "C:\Users\balaji\node\node-v22.14.0-win-x64\npm.cmd" ...`
3. Use `npm run dev` (fixed port **5173** in `vite.config.ts`). The dev server dies when the launching shell/command times out — to keep it alive, start detached, e.g.:
   ```powershell
   $out = "C:\Users\balaji\avatar-meet\dev.log"
   Start-Process cmd.exe -ArgumentList '/c', '"C:\Users\balaji\AppData\Local\Temp\opencode\start-avatar-meet.bat"' -WorkingDirectory "C:\Users\balaji\avatar-meet" -RedirectStandardOutput $out -RedirectStandardError "$out.err" -WindowStyle Hidden
   ```
   (there is a `.bat` launcher at `C:\Users\balaji\AppData\Local\Temp\opencode\start-avatar-meet.bat` that sets PATH then runs `npm run dev -- --host`).
4. **Disk-free pitfall seen earlier:** system can report 0 bytes free; user freed space once before by clearing recycle bin / temp. If a build/install fails with disk errors, re-check `Get-PSDrive`/`Win32_LogicalDisk`.
5. Browser needs camera permission for face-mapping (requested at toggle time, nothing logged/stored).

---

## How to run / test

1. Add-Nod to PATH (see above).
2. Start dev server (`npm run dev`) or use the `.bat` launcher; open `http://localhost:5173/`.
3. Click **Camera: OFF → ON** (top-level toggle). Browser prompts camera permission. A small
   "Local preview — only you see this" tile appears. Your avatar then mirrors head + expressions.
4. **Mic: OFF → ON** enables optional voice.

---

## Next logical steps / open todos (candidate for next session)

- **License/attribution:** `avatar.glb` is a Ready Player Me avatar (RPM was discontinued Jan 2026
  after Netflix acquisition; exported GLBs remain valid). Confirm license before shipping; the
  alternate Quaternius avatar (`demo-avatar.glb`) is CC0 but has **no** morph targets (can't do
  expressions). A clean drop-in replacement with a permissive license + ARKit morphs is desirable.
- Verify the 52-blendshape → avatar morph mapping visually in-browser on a real face (this was
  built and type-checked but not visually QA'd against a live camera).
- Disk: reclaim space (clear `dev-server.log`, old node zips in `Temp\opencode`).
- Optional: peer sync of expressions would require broadcasting `blends` via `sendState` — user
  explicitly chose **local-only control of one's own avatar**, so pose/blends are deliberately NOT broadcast.

---

## Project root
`C:\Users\balaji\avatar-meet`