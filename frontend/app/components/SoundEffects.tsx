import React, { forwardRef, useImperativeHandle, useRef } from "react";

const SoundEffects = forwardRef((props, ref) => {
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const wrongSoundRef = useRef<HTMLAudioElement>(null);

  useImperativeHandle(ref, () => ({
    playCorrectSound: () => correctSoundRef.current?.play(),
    playWrongSound: () => {
      if (wrongSoundRef.current) {
        wrongSoundRef.current.volume = 0.5; // set volume to 50%
        wrongSoundRef.current.play();
      }
    },
  }));

  return (
    <>
      <audio ref={correctSoundRef} src="/sound/correct.mp3" />
      <audio ref={wrongSoundRef} src="/sound/wrong.mp3" />
    </>
  );
});

SoundEffects.displayName = "SoundEffects";

export default SoundEffects;
