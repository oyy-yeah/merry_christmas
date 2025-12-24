import React, { useEffect, useRef, useState } from 'react';

// Primary: Internet Archive (Instrumental/Classic)
const AUDIO_URL_PRIMARY = "https://ia801306.us.archive.org/27/items/WeWishYouAMerryChristmas_111/WeWishYouAMerryChristmas.mp3";
// Fallback: Kevin MacLeod version from Incompetech/FMA (CC-BY 3.0)
const AUDIO_URL_BACKUP = "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Christmas_Rap/Kevin_MacLeod_-_We_Wish_you_a_Merry_Christmas.mp3";

interface AudioControllerProps {
  isPlaying: boolean;
}

export const AudioController: React.FC<AudioControllerProps> = ({ isPlaying }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentUrl, setCurrentUrl] = useState(AUDIO_URL_PRIMARY);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Clean up previous instance
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    const audio = new Audio(currentUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handleError = (e: Event) => {
        console.warn(`Audio source failed: ${currentUrl}`, e);
        if (!hasError && currentUrl === AUDIO_URL_PRIMARY) {
            console.log("Switching to backup audio source...");
            setHasError(true);
            setCurrentUrl(AUDIO_URL_BACKUP);
        }
    };

    audio.addEventListener('error', handleError);

    // If we are already supposed to be playing, try playing immediately after creation
    if (isPlaying) {
        audio.play().catch(e => console.log("Auto-play prevented or loading:", e));
    }

    return () => {
      audio.pause();
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [currentUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // It might be already playing from the mount effect, but calling play again is harmless (returns promise)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Expected during page load before interaction
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return null;
};