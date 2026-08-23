import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack } from "agora-rtc-sdk-ng";
import { appId } from "./rtm";

let client: IAgoraRTCClient | null = null;
let localAudio: ILocalAudioTrack | null = null;

export interface VoiceHandlers {
  micOn: () => boolean;
  enableMic: (on: boolean) => Promise<void>;
  speechLevel: (cb: (level: number) => void) => void;
  release: () => Promise<void>;
}

/** Joins an Agora RTC channel for voice only. Mic starts muted — preserving
 * the "voice-optional" promise. */
export async function joinVoice(roomName: string): Promise<VoiceHandlers> {
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  const uid = Number(`${Math.floor(Math.random() * 1e8)}`);
  await client.join(appId(), `voice:${roomName}`, null, uid);

  client.on("user-published", async (user, mediaType) => {
    if (mediaType === "audio") {
      await client!.subscribe(user, "audio");
      user.audioTrack?.play();
    }
  });

  let micValue = false;

  return {
    micOn: () => micValue,
    enableMic: async (on: boolean) => {
      if (!client) return;
      if (on) {
        if (!localAudio) {
          localAudio = await AgoraRTC.createMicrophoneAudioTrack();
        }
        await client.publish([localAudio]);
        micValue = true;
      } else {
        if (localAudio) await client.unpublish([localAudio]);
        micValue = false;
      }
    },
    speechLevel: (cb) => {
      // approximate: pulled from the local mic track volume periodically
      const timer = setInterval(() => {
        const vol = localAudio?.getVolumeLevel?.() ?? 0;
        cb(vol);
      }, 120);
      // TODO store/clear interval on release
      return () => clearInterval(timer);
    },
    release: async () => {
      localAudio?.close();
      localAudio = null;
      await client?.leave().catch(() => {});
      client = null;
    },
  };
}