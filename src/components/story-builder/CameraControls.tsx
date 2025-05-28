"use client";

import React from "react";
import { CameraSnapshot } from "../../types/camera";

interface CameraPositionDisplayProps {
  cameraSnapshot: CameraSnapshot | null;
}

interface CameraControlsProps {
  cameraSnapshot: CameraSnapshot | null;
}

// Camera Position Component
const CameraPositionDisplay = ({ cameraSnapshot }: CameraPositionDisplayProps) => {
  if (!cameraSnapshot) return null;

  return (
    <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-2 text-foreground">
        Camera Position
      </h3>
      <div className="text-xs font-mono text-muted-foreground space-y-1">
        <div>
          <span className="font-medium">Position:</span>
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
        {cameraSnapshot.fov && (
          <div>
            <span className="font-medium">FOV:</span>{" "}
            {cameraSnapshot.fov.toFixed(2)}°
          </div>
        )}
      </div>
    </div>
  );
};

export function CameraControls({ cameraSnapshot }: CameraControlsProps) {
  return <CameraPositionDisplay cameraSnapshot={cameraSnapshot} />;
}