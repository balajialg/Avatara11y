import RTMApp from "agora-rtm-sdk";

const RTMClient = RTMApp.RTM;
import { useRoomStore } from "../store";
import type { AvatarState, RemoteParticipant } from "../shared/types";

const STATE_CHANNEL_PREFIX = "__avatar_state__";

export function appId(): string {
  const id = import.meta.env.VITE_AGORA_APP_ID as string | undefined;
  if (!id) throw new Error("Missing VITE_AGORA_APP_ID in .env");
  return id;
}

interface Envelope {
  uid: string;
  displayName: string;
  body: AvatarState;
}

export interface RTMHandlers {
  sendState: (body: AvatarState) => void;
  leave: () => Promise<void>;
}

export interface RTMCallbacks {
  onParticipantState: (p: RemoteParticipant) => void;
}

/** Presence + avatar state sync over Agora RTM. Voice is handled in rtc.ts. */
export async function joinRtm(
  roomName: string,
  displayName: string,
  cb: RTMCallbacks,
): Promise<RTMHandlers> {
  const uid = makeUid();
  const channel = `${STATE_CHANNEL_PREFIX}:${roomName}`;
  const client = new RTMClient(appId(), uid);
  await client.login();

  client.addEventListener("message", (message) => {
    try {
      if (message.messageType !== "STRING") return;
      const env = JSON.parse(message.message as string) as Envelope;
      if (env.uid === uid) return;
      cb.onParticipantState({ uid: env.uid, state: env.body, micOn: false });
    } catch {}
  });

  await client.subscribe(channel);

  return {
    sendState: (body: AvatarState) => {
      const env: Envelope = { uid, displayName, body };
      client
        .publish(channel, JSON.stringify(env))
        .catch(() => {});
    },
    leave: async () => {
      await client.unsubscribe(channel).catch(() => {});
      await client.logout().catch(() => {});
    },
  };
}

function makeUid(): string {
  return `u_${Math.floor(Math.random() * 1e6)}`;
}

/** Send a fresh copy of own avatar state now (used on joined + look change). */
export function syncSelf(handlers: RTMHandlers) {
  const self = useRoomStore.getState().self;
  handlers.sendState(self);
}