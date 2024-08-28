'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import DoublePointsAlert from './DoublePointsAlert';
import SoundEffects from './SoundEffects';
import BackgroundMusic from './BackgroundMusic';
import Image from 'next/image';

export default function MultiplayerGame({ gameId }: { gameId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<{ id: string; score: number }[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const router = useRouter();
  const soundEffectsRef = useRef<{ playCorrectSound: () => void; playWrongSound: () => void } | null>(null);
  const [showDoublePointsAlert, setShowDoublePointsAlert] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');

  const totalQuestions = 10;
  const maxScore = 220;
  const calculateProgressPercentage = (score: number) => (score / maxScore) * 100;

  useEffect(() => {
    console.log('Initializing socket connection');
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected, joining game:', gameId);
      newSocket.emit('joinGame', gameId);
    });

    newSocket.on('gameJoined', (data) => {
      console.log('Game joined:', data);
      setPlayers(data.players);
      setImageUrl(data.imageUrl);
      setOptions(data.options);
      if (data.players.length === 2) {
        console.log('Two players joined, setting game status to playing');
        setGameStatus('playing');
      }
    });

    newSocket.on('gameStarted', (data) => {
      console.log('Game started event received:', data);
      setPlayers(data.players);
      setImageUrl(data.imageUrl);
      setOptions(data.options);
      setGameStatus('playing');
      setTimeLeft(10);
      setCurrentQuestion(1);
    });

    newSocket.on('newRound', (data) => {
      console.log('New round:', data);
      setCurrentQuestion(data.currentQuestion);
      setImageUrl(data.imageUrl);
      setOptions(data.options);
      setSelectedOption(null);
      setIsRevealed(false);
      setTimeLeft(10);
      if (data.currentQuestion === totalQuestions) {
        setShowDoublePointsAlert(true);
        setTimeout(() => setShowDoublePointsAlert(false), 4500);
      } else {
        setShowDoublePointsAlert(false);
      }
      setCorrectAnswer(data.correctAnswer);
      if (data.currentQuestion > totalQuestions) {
        setGameOver(true);
        setGameStatus('finished');
      }
    });

    newSocket.on('correctAnswer', (data) => {
      console.log('Correct answer:', data);
      setPlayers(prevPlayers => 
        prevPlayers.map(p => p.id === data.playerId ? { ...p, score: data.score } : p)
      );
      setCorrectAnswer(data.correctAnswer);
      if (data.playerId === newSocket.id) {
        soundEffectsRef.current?.playCorrectSound();
      }
    });

    newSocket.on('incorrectAnswer', (data) => {
      if (data.playerId === newSocket.id) {
        soundEffectsRef.current?.playWrongSound();
      }
    });

    newSocket.on('allPlayersAnswered', (data) => {
      setIsRevealed(true);
      if (data && data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    });

    newSocket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      if (data.gameId === gameId) {
        setPlayers(data.players);
        if (data.players.length < 2) {
          setGameStatus('finished');
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setGameStatus('finished');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [gameId]);

  useEffect(() => {
    if (timeLeft > 0 && !isRevealed && gameStatus === 'playing') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isRevealed && gameStatus === 'playing') {
      handleOptionClick(null);
    }
  }, [timeLeft, isRevealed, gameStatus]);

  const handleOptionClick = (option: string | null) => {
    if (isRevealed || gameStatus !== 'playing') return;
    setSelectedOption(option);
    setIsRevealed(true);
    submitAnswer(option);
  };

  const submitAnswer = (option: string | null) => {
    if (socket) {
      console.log('Submitting answer for question:', currentQuestion, 'Time left:', timeLeft);
      socket.emit('submitAnswer', { gameId, answer: option, currentQuestion, timeLeft });
    }
  };

  if (gameStatus === 'waiting') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Waiting for another player to join...</h1>
        <p>Game ID: {gameId}</p>
      </div>
    );
  }

  if (gameStatus === 'finished') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Game Over!</h1>
        <p>The other player left the game.</p>
      </div>
    );
  }

  return (
    <div className="text-center -mt-7">
      <BackgroundMusic />
      <SoundEffects ref={soundEffectsRef} />
      {showDoublePointsAlert && (
        <DoublePointsAlert onFinish={() => setShowDoublePointsAlert(false)} />
      )}
      <div className="flex justify-between mb-8 bg-gray-500 rounded">
        <p className="text-white px-3 py-1 rounded"><span className="font-bold">Time:</span> {timeLeft}s</p>
        <p className="text-white px-3 py-1 rounded"><span className="font-bold">Question:</span> {currentQuestion}/{totalQuestions}</p>
      </div>
      <div className="mb-4 flex items-center space-x-6">
        <p className="w-26"><span className="font-bold">Player 1:</span> {players[0]?.score || 0}</p>
        <div className="flex-grow bg-gray-400 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{width: `${calculateProgressPercentage(players[0]?.score || 0)}%`}}
          ></div>
        </div>
      </div>
      <div className="flex justify-center mt-4 mb-4 relative">
        <Image
          key={imageUrl}
          src={imageUrl}
          alt="Pokemon"
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
            className={`p-2 text-white rounded min-w-[200px] ${
              isRevealed
                ? option === correctAnswer
                  ? 'bg-green-600'
                  : selectedOption === option
                  ? 'bg-red-600'
                  : 'bg-gray-500'
                : 'bg-blue-700 hover:bg-blue-900'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-8 flex items-center space-x-6">
        <p className="w-26"><span className="font-bold">Player 2:</span> {players[1]?.score || 0}</p>
        <div className="flex-grow bg-gray-400 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{width: `${calculateProgressPercentage(players[1]?.score || 0)}%`}}
          ></div>
        </div>
      </div>
      {(isRevealed && currentQuestion === totalQuestions) || gameOver ? (
        <div>
          <p className="mt-8 text-lg">
            <span className="font-bold">Game over!</span> 
            {players[0].score > players[1].score 
              ? ` Player 1 wins, with ${players[0].score} points!` 
              : players[1].score > players[0].score 
              ? ` Player 2 wins, with ${players[1].score} points!` 
              : " It's a tie!"}
          </p>
          <button
            onClick={() => router.push('/multiplayer')}
            className="mt-4 p-2 mx-2 bg-green-600 text-white rounded hover:bg-green-700 -mb-10"
          >
            New Game
          </button>
        </div>
      ) : null}
    </div>
  );
}


