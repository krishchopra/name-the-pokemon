'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

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
      setShowDoublePointsAlert(data.currentQuestion === totalQuestions);
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
      setPlayers(data.players);
      if (data.players.length < 2) {
        setGameStatus('finished');
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
    soundEffectsRef.current = {
      playCorrectSound: () => new Audio('/sound/correct.mp3').play(),
      playWrongSound: () => new Audio('/sound/wrong.mp3').play(),
    };
  }, []);

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
      console.log('Submitting answer for question:', currentQuestion);
      socket.emit('submitAnswer', { gameId, answer: option, currentQuestion });
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
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Name that Pokémon!</h1>
      {showDoublePointsAlert && (
        <div className="bg-yellow-400 text-black p-2 mb-4 rounded">
          Final Question: 2x Points!
        </div>
      )}
      <div className="mb-4">
        {players.map((player, index) => (
          <div key={player.id} className="mb-2">
            <p>Player {index + 1}: {player.score} points</p>
            <div className="w-full bg-gray-400 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(player.score / (totalQuestions * 10)) * 100}%`}}></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <img src={imageUrl} alt="Pokemon" className="mx-auto" />
      </div>
      <div className="mb-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`p-2 mx-2 ${
              isRevealed
                ? option === correctAnswer
                  ? 'bg-green-500'
                  : selectedOption === option
                  ? 'bg-red-500'
                  : 'bg-gray-300'
                : selectedOption === option
                ? 'bg-blue-700'
                : 'bg-blue-500'
            } text-white rounded hover:bg-blue-700`}
            disabled={isRevealed}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mb-5 mt-8">
        <p>Time left: {timeLeft} seconds</p>
        <p>Question {currentQuestion} of {totalQuestions}</p>
      </div>
      {(isRevealed && currentQuestion === totalQuestions) || gameOver ? (
        <div>
          <p className="mt-4 text-lg">
            <span className="font-bold">Game over!</span> 
            {players[0].score > players[1].score 
              ? ` Player 1 wins with ${players[0].score} points!` 
              : players[1].score > players[0].score 
              ? ` Player 2 wins with ${players[1].score} points!` 
              : " It's a tie!"}
          </p>
          <button
            onClick={() => router.push('/multiplayer')}
            className="mt-4 p-2 mx-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Game
          </button>
        </div>
      ) : null}
    </div>
  );
}


