'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface MultipleChoiceProps {
  correctAnswer: string;
  allPokemon: string[];
  imageUrl: string;
}

export default function MultipleChoice({ correctAnswer, allPokemon, imageUrl }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setOptions(generateOptions());
    setSelectedOption(null);
    setIsRevealed(false);
  }, [correctAnswer, allPokemon]);

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
    setSelectedOption(option);
    setIsRevealed(true);
  };

  const getOptionClass = (option: string) => {
    if (!isRevealed) return 'bg-blue-500 hover:bg-blue-600';
    if (option === correctAnswer) return 'bg-green-500';
    if (option === selectedOption) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const handleNewPokemon = () => {
    router.refresh();
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Who's that Pokémon?</h1>
      <div className="flex justify-center mt-4 mb-4 relative">
        <Image
          key={imageUrl}
          src={imageUrl}
          alt={correctAnswer}
          width={200}
          height={200}
          className="animate-fade-in"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleOptionClick(option)}
            disabled={isRevealed}
            className={`p-2 text-white rounded ${getOptionClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      {isRevealed && (
        <button
          onClick={handleNewPokemon}
          className="mt-10 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Pokémon
        </button>
      )}
    </div>
  );
}
