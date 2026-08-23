import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { Look } from "./presets";
import type { FacePose } from "../useFaceTracking";

interface AvatarModelProps {
  look: Look;
  talking: boolean;
  pose?: React.MutableRefObject<FacePose>;
  blends?: React.MutableRefObject<Record<string, number>>;
}

/** Mapping from MediaPipe ARKit blendshape names to a stronger jaw/eye impulse
 * used when no camera blendshapes are available (e.g. mic-only talking). */
const NEUTRAL: Record<string, number> = {};

/**
 * A realistic Ready Player Me humanoid GLB. The 52 ARKit morph targets on the
 * face meshes are driven directly by MediaPipe's on-device blendshapes.
 */
export function AvatarModel({ look, talking, pose, blends }: AvatarModelProps) {
  const gltf = useLoader(GLTFLoader, "/avatar.glb");

  const { headBone, faceMeshes } = useMemo<{
    headBone: THREE.Object3D | null;
    faceMeshes: THREE.Mesh[];
  }>(() => {
    const face: THREE.Mesh[] = [];
    let head: THREE.Object3D | null = null;
    gltf.scene.traverse((o) => {
      if (o.name === "Head") head = o;
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
        face.push(mesh);
      }
    });
    return { headBone: head, faceMeshes: face };
  }, [gltf]);

  const idle = useRef(Math.random() * 100);

  // Recolour the outfit to the user's chosen look (cloned so tints don't leak).
  useLayoutEffect(() => {
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = mesh.name.toLowerCase();
      if (name.includes("outfit") && (mesh.material as THREE.Material)) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.color = new THREE.Color(look.top);
        mesh.material = mat;
      }
    });
  }, [gltf, look.top]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (headBone) {
      headBone.position.y = Math.sin(t * 1.6 + idle.current) * 0.02;
      headBone.rotation.z = Math.sin(t * 0.7 + idle.current) * 0.03;
    }

    // Head orientation from camera pose.
    if (pose && headBone) {
      const p = pose.current;
      headBone.rotation.y = p.yaw * 0.45;
      headBone.rotation.x = -p.pitch * 0.45;
    }

    // ARKit blendshapes from MediaPipe -> morph target weights.
    if (blends && faceMeshes.length > 0) {
      const b = blends.current;
      for (const mesh of faceMeshes) {
        const dict = mesh.morphTargetDictionary!;
        const inf = mesh.morphTargetInfluences!;
        for (const name of Object.keys(dict)) {
          inf[dict[name]] = b[name] ?? NEUTRAL[name] ?? 0;
        }
      }
    }

    // Mic-only talking fallback: drive jaw + blink rhythm without camera.
    if (talking && !blends) {
      const open = (Math.sin(t * 22) * 0.5 + 0.5) * 0.55;
      for (const mesh of faceMeshes) {
        const dict = mesh.morphTargetDictionary!;
        const inf = mesh.morphTargetInfluences!;
        if (dict["jawOpen"] !== undefined) inf[dict["jawOpen"]] = open;
      }
    }
  });

  return <primitive object={gltf.scene} />;
}