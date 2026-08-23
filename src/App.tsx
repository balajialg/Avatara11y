import { useState } from "react";
import { IdentityPicker } from "./components/IdentityPicker";
import { MeetingRoom } from "./components/MeetingRoom";
import { useRoomStore } from "./store";

interface Session {
  room: string;
  name: string;
  lookId: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return (
      <IdentityPicker
        onJoin={(room, name, lookId) => {
          const uid = `u_${Math.floor(Math.random() * 1e6)}`;
          useRoomStore.setState({ uid, channel: room, displayName: name, joined: true, self: { lookId, mode: "text", talking: false } });
          setSession({ room, name, lookId });
        }}
      />
    );
  }

  return (
    <MeetingRoom
      room={session.room}
      displayName={session.name}
      onLeave={() => {
        useRoomStore.getState().reset();
        setSession(null);
      }}
    />
  );
}