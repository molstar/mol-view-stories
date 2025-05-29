"use client";

import { ActiveSceneAtom, CameraPositionAtom, modifyCurrentScene } from "@/app/appstate";
import { useAtomValue, useStore } from "jotai";
import type { Camera } from "molstar/lib/mol-canvas3d/camera";
import { Button } from "../ui/button";

// Camera Position Component
const CameraPositionDisplay = ({ cameraSnapshot }: { cameraSnapshot?: Camera.Snapshot | null }) => {
  if (!cameraSnapshot) return null;

  return (
    <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
      <div className="text-xs font-mono text-muted-foreground space-y-1">
        <div>
          <span className="font-medium">Camera Position:</span>
          {cameraSnapshot.position
            ? ` [${cameraSnapshot.position[0]?.toFixed(2)}, ${cameraSnapshot.position[1]?.toFixed(2)}, ${cameraSnapshot.position[2]?.toFixed(2)}]`
            : " N/A"}
        </div>
        <div>
          <span className="font-medium">Target:</span>
          {cameraSnapshot.target
            ? ` [${cameraSnapshot.target[0]?.toFixed(2)}, ${cameraSnapshot.target[1]?.toFixed(2)}, ${cameraSnapshot.target[2]?.toFixed(2)}]`
            : " N/A"}
        </div>
        <div>
          <span className="font-medium">Up:</span>
          {cameraSnapshot.up
            ? ` [${cameraSnapshot.up[0]?.toFixed(2)}, ${cameraSnapshot.up[1]?.toFixed(2)}, ${cameraSnapshot.up[2]?.toFixed(2)}]`
            : " N/A"}
        </div>
        {cameraSnapshot.radius && (
          <div>
            <span className="font-medium">Radius:</span>{" "}
            {cameraSnapshot.radius.toFixed(2)}
          </div>
        )}
        {/* {cameraSnapshot.fov && (
          <div>
            <span className="font-medium">FOV:</span>{" "}
            {((180 / Math.PI) * cameraSnapshot.fov).toFixed(2)}°
          </div>
        )} */}
      </div>
    </div>
  );
};

export function CameraControls() {
  const cameraSnapshot = useAtomValue(CameraPositionAtom);
  const scene = useAtomValue(ActiveSceneAtom);
  const store = useStore();

  return <div className="space-y-4">
    <div className="flex items-center gap-2">
      <Button onClick={() => modifyCurrentScene(store, { camera: cameraSnapshot }) }>
        Store Camera
      </Button>
      <Button onClick={() => modifyCurrentScene(store, { camera: undefined }) }>
        Clear Camera
      </Button>
    </div>
    <div>
      {!scene?.camera && <p className="text-sm text-muted-foreground">No camera position stored for this scene.</p>}
      {!!scene?.camera && <CameraPositionDisplay cameraSnapshot={scene?.camera} />}
    </div>
  </div>
}