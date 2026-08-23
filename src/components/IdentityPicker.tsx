import { useState } from "react";
import { LOOKS } from "../avatar/presets";
import { AvatarCanvas } from "../avatar/AvatarCanvas";
import { styles } from "../styles";

interface IdentityPickerProps {
  initialLook?: string;
  displayName?: string;
  onJoin: (room: string, name: string, lookId: string) => void;
  busy?: boolean;
  error?: string | null;
}

export function IdentityPicker({
  initialLook = LOOKS[0].id,
  displayName = "",
  onJoin,
  busy,
  error,
}: IdentityPickerProps) {
  const [lookId, setLookId] = useState(initialLook);
  const [name, setName] = useState(displayName);
  const [room, setRoom] = useState("demo");

  const look = LOOKS.find((l) => l.id === lookId) ?? LOOKS[0];

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>AvatarMeet</h1>
        <p style={styles.tagline}>
          You appear as an avatar. Camera and mic are never turned on unless
          you want them to be.
        </p>

        <div style={styles.avatarBox}>
          <AvatarCanvas look={look} talking={false} size={170} />
        </div>

        {/* preset looks */}
        <div style={styles.preseWrap}>
          {LOOKS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLookId(l.id)}
              style={{
                ...styles.swatch,
                background: l.top,
                outline: l.id === lookId ? "3px solid #7aa7ff" : "1px solid #334",
              }}
              title={l.name}
              aria-label={`select look ${l.name}`}
            >
              {l.name.charAt(0)}
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name"
          style={styles.input}
        />
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room name"
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={() => onJoin(room, name || "Guest", lookId)}
          disabled={busy}
          style={styles.join}
        >
          {busy ? "Joining…" : "Join room"}
        </button>
      </div>
    </div>
  );
}