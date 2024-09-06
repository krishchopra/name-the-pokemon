'use client';

import { useState, useEffect, useRef } from 'react';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIsPlaying = localStorage.getItem('musicPlaying') === 'true';
      const savedVolume = parseFloat(localStorage.getItem('musicVolume') || '0.1');
      setIsPlaying(savedIsPlaying);
      setVolume(savedVolume);

      audioRef.current = new Audio('/sound/pokemon-theme.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = savedVolume;

      if (savedIsPlaying) {
        audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
      }
    }

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('musicVolume', volume.toString());
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
      } else {
        audioRef.current.pause();
      }
    }
    localStorage.setItem('musicPlaying', isPlaying.toString());
  }, [isPlaying]);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="flex items-center">
      <input
        type="range"
        min="0"
        max="1"
        step="any"
        value={volume}
        onChange={handleVolumeChange}
        className="mr-4 rounded-full"
        style={{
          cursor: 'grab'
        }}
      />
      <button
        onClick={toggleMusic}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full text-sm"
      >
        {isPlaying ? 'Music Off' : 'Music On'}
      </button>
    </div>
  );
}

