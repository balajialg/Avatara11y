import { create } from "zustand";
import type { AvatarState, RemoteParticipant } from "./shared/types";

interface RoomState {
  channel: string;
  uid: string;
  displayName: string;
  self: AvatarState;
  participants: RemoteParticipant[];
  joined: boolean;
  micOn: boolean;
  setSelf: (patch: Partial<AvatarState>) => void;
  setMic: (on: boolean) => void;
  upsertParticipant: (p: RemoteParticipant) => void;
  removeParticipant: (uid: string) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  channel: "",
  uid: "",
  displayName: "",
  self: {
    lookId: "look-1",
    mode: "text",
    talking: false,
  },
  participants: [],
  joined: false,
  micOn: false,
  setSelf: (patch) => set((s) => ({ self: { ...s.self, ...patch } })),
  setMic: (on) => set({ micOn: on }),
  upsertParticipant: (p) =>
    set((s) => {
      const i = s.participants.findIndex((x) => x.uid === p.uid);
      if (i === -1) return { participants: [...s.participants, p] };
      const copy = [...s.participants];
      copy[i] = p;
      return { participants: copy };
    }),
  removeParticipant: (uid) =>
    set((s) => ({ participants: s.participants.filter((x) => x.uid !== uid) })),
  reset: () => set({ participants: [], joined: false, micOn: false }),
}));