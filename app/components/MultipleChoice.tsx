'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TimerAndScore from './TimerAndScore';

interface MultipleChoiceProps {
  correctAnswer: string;
  allPokemon: string[];
  imageUrl: string;
}

export default function MultipleChoice({ correctAnswer, allPokemon, imageUrl }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const router = useRouter();

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
      if (currentQuestion === totalQuestions) {
        // for the last question, max points is 40
        pointsEarned = timeLeft >= 8 ? 40 : Math.max(39 - (9 - timeLeft), 20);
      } else {
        // for other questions, max points is 20
        pointsEarned = timeLeft >= 8 ? 20 : Math.max(19 - (9 - timeLeft), 10);
      }
      setScore(score + pointsEarned);
    }
  };

  const getOptionClass = (option: string) => {
    if (!isRevealed) return 'bg-blue-700 hover:bg-blue-900';
    if (option === correctAnswer) return 'bg-green-600';
    if (option === selectedOption) return 'bg-red-600';
    return 'bg-gray-500';
  };

  const handleNewPokemon = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
      router.refresh();
    } else {
      setGameOver(true);
    }
  };

  return (
    <div className="text-center">
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
            onClick={() => window.location.reload()}
            className="mt-4 p-2 mx-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
}
