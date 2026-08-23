import { Canvas } from "@react-three/fiber";
import { AvatarModel } from "./AvatarModel";
import type { Look } from "./presets";
import type { FacePose } from "../useFaceTracking";

interface AvatarCanvasProps {
  look: Look;
  talking: boolean;
  pose?: React.MutableRefObject<FacePose>;
  blends?: React.MutableRefObject<Record<string, number>>;
  size?: number;
}

export function AvatarCanvas({ look, talking, pose, blends, size = 200 }: AvatarCanvasProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 30% 30%, #2b3550, #141827)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <Canvas camera={{ position: [0, 0.2, 1.3], fov: 45 }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <directionalLight position={[-3, 1, 2]} intensity={0.5} color="#9fc2ff" />
        <AvatarModel look={look} talking={talking} pose={pose} blends={blends} />
      </Canvas>
    </div>
  );
}