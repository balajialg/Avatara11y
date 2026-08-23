export type PresenceMode = "text" | "voice" | "camera";

export interface AvatarState {
  lookId: string;
  talking: boolean;
  mode: PresenceMode;
}

export interface RemoteParticipant {
  uid: string;
  state: AvatarState;
  micOn: boolean;
}