import { useEffect, useRef, useState } from "react";
import { useRoomStore } from "../store";
import { getLook } from "../avatar/presets";
import { AvatarCanvas } from "../avatar/AvatarCanvas";
import { joinRtm, type RTMHandlers } from "../agora/rtm";
import { joinVoice, type VoiceHandlers } from "../agora/rtc";
import { roomStyles } from "../styles";
import { useFaceTracking } from "../useFaceTracking";

interface MeetingRoomProps {
  room: string;
  displayName: string;
  onLeave: () => void;
}

export function MeetingRoom({ room, displayName, onLeave }: MeetingRoomProps) {
  const { self, participants, setSelf, upsertParticipant, reset } =
    useRoomStore();
  const [micOn, setMicOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rtmRef = useRef<RTMHandlers | null>(null);
  const voiceRef = useRef<VoiceHandlers | null>(null);
  const face = useFaceTracking();
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);

  // join once
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const rtm = await joinRtm(room, displayName, {
          onParticipantState: (p) => upsertParticipant(p),
        });
        rtmRef.current = rtm;
        rtm.sendState(self);

        const voice = await joinVoice(room);
        voiceRef.current = voice;
      } catch (e) {
        if (!disposed) setError((e as Error).message);
      }
    })();
    return () => {
      disposed = true;
      rtmRef.current?.leave();
      voiceRef.current?.release();
      reset();
    };
  }, []);

  useEffect(() => {
    if (rtmRef.current) rtmRef.current.sendState(self);
  }, [self]);

  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    await voiceRef.current?.enableMic(next);
    setSelf({ talking: next, mode: next ? "voice" : "text" });
    if (rtmRef.current) rtmRef.current.sendState(self);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      face.stop();
      setCameraOn(false);
      setSelf({ mode: "text" });
      return;
    }
    setCameraBusy(true);
    try {
      await face.start();
      setCameraOn(true);
      setSelf({ mode: "camera" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCameraBusy(false);
    }
  };

  const selfLook = getLook(self.lookId);
  const myTile = (
    <AvatarCanvas
      key="self"
      look={selfLook}
      talking={self.talking}
      pose={face.pose}
      blends={face.blends}
    />
  );
  const tiles = participants.map((p) => {
    const look = getLook(p.state.lookId);
    return (
      <div key={p.uid} style={{ textAlign: "center" }}>
        <AvatarCanvas look={look} talking={p.state.talking} />
        <div style={{ fontSize: 13, color: "#c9d4f2", marginTop: 6 }}>{p.uid}</div>
      </div>
    );
  });

  return (
    <div style={roomStyles.room}>
      <div style={roomStyles.topBar}>
        <strong>{room}</strong>
        <button onClick={onLeave} style={roomStyles.leave}>Leave</button>
      </div>

      {error && <p style={{ color: "#ff7a7a" }}>{error}</p>}

      <div style={roomStyles.grid}>
        <div style={{ textAlign: "center" }}>
          {myTile}
          <div style={{ fontSize: 13, color: "#c9d4f2", marginTop: 6 }}>You ({displayName})</div>
          {cameraOn && (
            <div style={{ marginTop: 8 }}>
              <div
                ref={(host) => {
                  if (!host) return;
                  if (face.video) host.replaceChildren(face.video);
                }}
                style={{
                  width: 120,
                  height: 90,
                  borderRadius: 8,
                  border: "1px solid #7aa7ff",
                  overflow: "hidden",
                  margin: "0 auto",
                }}
              />
              <div style={{ fontSize: 11, color: "#8aa0c4", marginTop: 4 }}>
                Local preview — only you see this
              </div>
            </div>
          )}
        </div>
        {tiles}
      </div>

      <div style={roomStyles.controls}>
        <button onClick={toggleMic} style={roomStyles.btn} title="Voice optional — stays off unless you turn it on">
          {micOn ? "Mic: ON" : "Mic: OFF"}
        </button>
        <button
          onClick={toggleCamera}
          disabled={cameraBusy}
          style={{
            ...roomStyles.btn,
            outline: cameraOn ? "2px solid #7aa7ff" : "none",
          }}
          title="On-device face mapping — your image never leaves this device"
        >
          {cameraBusy ? "Starting…" : cameraOn ? "Camera: ON" : "Camera: OFF"}
        </button>
      </div>

      <p style={roomStyles.privnote}>
        Your image is processed on this device only and never sent — your camera
        feed never leaves your machine. Mic is optional; you control what others
        see and hear.
      </p>
    </div>
  );
}