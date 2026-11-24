import React, { useState, useEffect, useRef } from 'react';
import { StudioInspector } from './components/StudioInspector.jsx';
import { Game } from './Game.js';

export function App() {
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [viewMode, setViewMode] = useState(
    urlParams.get('mode') === 'game' 
      ? 'game' 
      : urlParams.get('mode') === 'studio' 
        ? 'studio' 
        : 'mumbai3d'
  );
  const canvasContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    if (viewMode === 'game' && canvasContainerRef.current && !gameInstanceRef.current) {
      gameInstanceRef.current = new Game(canvasContainerRef.current);
      window.__game = gameInstanceRef.current;
    }
  }, [viewMode]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Direct Full-Screen Open World Experience */}
      {viewMode === 'mumbai3d' && (
        <iframe
          src="/mumbai-3d/"
          title="PiSecOps: Mumbai Open World"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
        />
      )}

      {viewMode === 'studio' && (
        <StudioInspector
          onEnterGame={() => setViewMode('game')}
          onEnterMumbai3D={() => setViewMode('mumbai3d')}
        />
      )}

      {viewMode === 'game' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div ref={canvasContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  );
}
