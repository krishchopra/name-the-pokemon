'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TimerAndScore from './TimerAndScore';
import BackgroundMusic from './BackgroundMusic';
import SoundEffects from './SoundEffects';
import DoublePointsAlert from './DoublePointsAlert';

interface MultipleChoiceProps {
  correctAnswer: string;
  allPokemon: string[];
  imageUrl: string;
  onScoreUpdate?: (score: number) => void;
  isMultiplayer?: boolean;
}

export default function MultipleChoice({ correctAnswer, allPokemon, imageUrl, onScoreUpdate, isMultiplayer }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const router = useRouter();
  const soundEffectsRef = useRef<{ playCorrectSound: () => void; playWrongSound: () => void } | null>(null);
  const [showDoublePointsAlert, setShowDoublePointsAlert] = useState(false);

  const totalQuestions = 10;

  useEffect(() => {
    setOptions(generateOptions());
    setSelectedOption(null);
    setIsRevealed(false);
    setTimeLeft(10);
  }, [correctAnswer, allPokemon]);

  useEffect(() => {
    if (timeLeft > 0 && !isRevealed) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isRevealed) {
      setIsRevealed(true);
    }
  }, [timeLeft, isRevealed]);

  const generateOptions = () => {
    const newOptions = [correctAnswer];
    while (newOptions.length < 4) {
      const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
      if (!newOptions.includes(randomPokemon)) {
        newOptions.push(randomPokemon);
      }
    }
    return newOptions.sort(() => Math.random() - 0.5);
  };

  const handleOptionClick = (option: string) => {
    if (isRevealed) return;
    setSelectedOption(option);
    setIsRevealed(true);
    if (option === correctAnswer) {
      let pointsEarned;
      if (timeLeft >= 8.5) {
        pointsEarned = 20;
      } else if (timeLeft >= 8) {
        pointsEarned = 19;
      } else {
        pointsEarned = Math.max(18 - Math.floor(10 - timeLeft), 1);
      }
      
      // double the points for the last question
      if (currentQuestion === totalQuestions) {
        pointsEarned *= 2;
      }
      
      setScore(score + pointsEarned);
      if (isMultiplayer && onScoreUpdate) {
        onScoreUpdate(score + pointsEarned);
      }
      soundEffectsRef.current?.playCorrectSound();
    } else {
      soundEffectsRef.current?.playWrongSound();
    }
  };

  const getOptionClass = (option: string) => {
    if (!isRevealed) return 'bg-blue-700 hover:bg-blue-900';
    if (option === correctAnswer) return 'bg-green-600';
    if (option === selectedOption) return 'bg-red-600';
    return 'bg-gray-500';
  };

  const handleNewPokemon = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      router.refresh();
    } else if (currentQuestion === totalQuestions - 1) {
      setShowDoublePointsAlert(true);
    } else {
      setGameOver(true);
    }
  };

  return (
    <div className="text-center">
      <BackgroundMusic />
      <SoundEffects ref={soundEffectsRef} />
      {showDoublePointsAlert ? (
        <DoublePointsAlert onFinish={() => {
          setShowDoublePointsAlert(false);
          setCurrentQuestion(currentQuestion + 1);
          router.refresh();
        }} />
      ) : (
        <>
          <TimerAndScore 
            timeLeft={timeLeft} 
            score={score} 
            totalQuestions={totalQuestions} 
            currentQuestion={currentQuestion} 
          />
          <h1 className="text-3xl font-bold mb-4">Who&apos;s that Pokémon?</h1>
          <div className="flex justify-center mt-8 mb-4 relative">
            <Image
              key={imageUrl}
              src={imageUrl}
              alt={correctAnswer}
              width={200}
              height={200}
              className="animate-fade-in"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={isRevealed}
                className={`p-2 text-white rounded min-w-[200px] ${getOptionClass(option)}`}
              >
                {option}
              </button>
            ))}
          </div>
          {isRevealed && !gameOver && (
            <button
              onClick={handleNewPokemon}
              className="mt-10 p-2 mx-2 bg-blue-700 text-white rounded hover:bg-blue-900"
            >
              {currentQuestion < totalQuestions ? "Next Pokémon" : "Finish Game"}
            </button>
          )}
          {gameOver && (
            <div>
              <p className="mt-10 text-lg">
                <span className="font-bold">Game over!</span> Your final score is {score} out of 220.
              </p>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="mt-4 p-2 mx-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                New Game
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
