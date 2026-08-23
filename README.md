# Avatara11y

## Avatar-based meeting tool for users who prefer not to reveal their camera

**Everyone gets a face. Only they decide what it is.**

Avatara11y is a Zoom-like video meeting tool where all participants appear as realistic avatars. It's designed primarily for people with disabilities who don't want to reveal themselves on camera, but any user can benefit from the privacy and expressivity of avatar-based communication.

### Core features

- **Avatar by default** — Everyone appears as a customizable avatar; camera feed is never required
- **Mic optional** — Voice is optional; you control whether others hear you
- **Camera optional** — Camera feed is processed on-device only and never sent to other participants
- **On-device face mapping** — MediaPipe Face Landmarker tracks head pose (yaw/pitch/roll) and 52 ARKit facial blendshapes in real time, all locally on the user's device
- **6 avatar looks** — Choose from preset styles (Moss, Lagoon, Sunset, Dusk, Amber, Cloud) with unique skin, hair, and outfit colors
- **Agora integration** — Voice via Agora RTC SDK; avatar state sync via Agora RTM SDK
- **Privacy-first** — Your camera image stays on your device; only avatar state (look ID, talking mode) is shared

### Technical stack

- **Vite + React + TypeScript** with zustand for state management
- **Three.js + @react-three/fiber** for rendering realistic avatars from a Ready Player Me GLB with 52 ARKit morph targets
- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) for on-device facial tracking and blendshape extraction
- **Agora RTM SDK** (2.2.4) for presence + avatar state synchronization
- **Agora RTC SDK** (4.23.0) for optional voice/mic

### Getting started

1. Ensure Node.js is on your PATH (`C:\Users\balaji\node\node-v22.14.0-win-x64` + `$env:Path`)
2. Run `npm run dev` — dev server starts on `http://localhost:5173/`
3. Open the URL, select a look/name/room, and join
4. Toggle "Camera: ON" to enable face mapping (browser prompts camera permission — feed stays local)
5. Toggle "Mic: ON" to enable optional voice

### License

The Ready Player Me avatar (`public/avatar.glb`) is a exported GLB that remains valid after RPM's discontinuation. Confirm license before shipping; an alternate CC0 avatar is available but lacks morph targets.

---

*Written for the next opencode session to resume exactly where the last one stopped.*