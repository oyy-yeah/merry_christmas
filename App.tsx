import React, { useState, useCallback } from 'react';
import { Experience } from './components/Experience';
import { AudioController } from './components/AudioController';
import { HandTracker } from './components/HandTracker';
import { AppState } from './types';

// Icons
const MuteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 21 12m0 0-3.75 2.25M21 12l-3.75-2.25m-9 5.25 2.25 2.25m2.25-2.25-2.25-2.25m-2.25 2.25L6.75 12m6 0L9.75 9.75M9.75 21.75c-1.38 0-2.577-1.017-2.653-2.39L6.85 14.56l-3.213-3.212C3.153 10.865 3 10.423 3 9.75s.153-1.115.637-1.598l3.213-3.213 2.546 4.801c.076-1.373 1.273-2.39 2.653-2.39h5.25c1.464 0 2.652 1.188 2.652 2.652v7.5c0 1.464-1.188 2.652-2.652 2.652H9.75Z" />
  </svg>
);

const SoundIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
  </svg>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleInteraction = useCallback(() => {
    // Start audio on first interaction if not playing
    if (!hasInteracted) {
        setHasInteracted(true);
        setIsAudioPlaying(true);
    }

    // Cycle states: TREE -> SCATTER -> TEXT -> TREE
    setAppState((prev) => {
      if (prev === AppState.TREE) return AppState.SCATTER;
      if (prev === AppState.SCATTER) return AppState.TEXT;
      return AppState.TREE;
    });
  }, [hasInteracted]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAudioPlaying(!isAudioPlaying);
  };

  return (
    <div className="relative w-full h-full bg-black select-none">
      {/* 3D Scene */}
      <Experience appState={appState} handleInteraction={handleInteraction} />

      {/* Audio Logic */}
      <AudioController isPlaying={isAudioPlaying} />

      {/* Hand Tracker */}
      <HandTracker onInteraction={handleInteraction} />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex flex-col items-center z-10">
        <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 font-serif font-bold tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]"
            style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>
          MERRY CHRISTMAS
        </h1>
        <p className="text-yellow-100/70 mt-4 text-sm md:text-base tracking-widest font-light">
          CLICK OR USE HAND GESTURES
        </p>
      </div>

      {/* Audio Toggle Button */}
      <button 
        onClick={toggleAudio}
        className="absolute bottom-8 right-8 pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-yellow-100 transition-colors"
      >
        {isAudioPlaying ? <SoundIcon /> : <MuteIcon />}
      </button>

      {/* Intro Overlay (disappears after interaction) */}
      {!hasInteracted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40">
           <div className="bg-black/60 backdrop-blur-md border border-yellow-500/30 p-6 rounded-lg text-center animate-pulse">
              <p className="text-yellow-400 font-serif text-lg">
                Show your open palm to click<br/>
                Move hand to rotate view
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
