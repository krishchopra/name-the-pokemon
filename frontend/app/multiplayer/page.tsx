'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

export default function MultiplayerPage() {
  const [gameId, setGameId] = useState('');
  const router = useRouter();

  const createGame = async () => {
    const newGameId = Math.random().toString(36).substring(2, 8);
    // const socket = io("http://localhost:3001"); -- for testing
    const socket = io("https://name-the-pokemon.onrender.com");

    socket.on('connect', () => {
      console.log('Socket connected, creating game:', newGameId);
      socket.emit('createGame', newGameId);
    });

    socket.on('gameCreated', (data) => {
      console.log('Game created:', data);
      router.push(`/multiplayer/${newGameId}`);
    });

    socket.on('error', (error) => {
      console.error('Error creating game:', error);
    });
  };

  const joinGame = () => {
    if (gameId) {
      router.push(`/multiplayer/${gameId}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold mb-10">Multiplayer - Name the Pokémon</h1>
      <div className="space-y-4">
        <button
          onClick={createGame}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Game
        </button>
        <div>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID"
            className="border-2 border-gray-300 text-black bg-white h-10 px-5 rounded-lg text-md focus:outline-none"
          />
          <button
            onClick={joinGame}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
          >
            Join Game
          </button>
        </div>
      </div>
    </main>
  );
}
