'use client';

import React from 'react';
import { RemoteLaserPayload } from '@/lib/remote-sync';

interface RemoteLaserOverlayProps {
  laserState: RemoteLaserPayload | null;
}

export const RemoteLaserOverlay: React.FC<RemoteLaserOverlayProps> = ({ laserState }) => {
  if (!laserState || !laserState.active) return null;

  const { x, y, mode } = laserState;

  if (mode === 'SPOTLIGHT') {
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none transition-all duration-75 ease-out">
        {/* Darkened Mask with Spotlight Cutout */}
        <div
          className="absolute inset-0 bg-black/60"
          style={{
            maskImage: `radial-gradient(circle 140px at ${x}% ${y}%, transparent 95%, black 100%)`,
            WebkitMaskImage: `radial-gradient(circle 140px at ${x}% ${y}%, transparent 95%, black 100%)`,
          }}
        />
        {/* Spotlight Gold Glow Ring */}
        <div
          className="absolute w-72 h-72 rounded-full border-2 border-amber-300/80 shadow-[0_0_50px_rgba(251,191,36,0.6)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>
    );
  }

  // Default: Glowing Virtual Red Laser Pointer
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        {/* Outer Laser Halo Glow */}
        <div className="w-12 h-12 rounded-full bg-red-500/30 animate-ping absolute inset-0 -m-3" />
        <div className="w-8 h-8 rounded-full bg-red-500/50 blur-xs absolute inset-0 -m-1" />

        {/* Core Laser Dot */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-rose-700 shadow-[0_0_20px_#ef4444] border-2 border-white/90 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>
    </div>
  );
};
