"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function MultiplayerPage() {
  const [gameId, setGameId] = useState("");
  const router = useRouter();

  const createGame = async () => {
    const newGameId = Math.random().toString(36).substring(2, 8);
    const socketUrl =
      process.env.NODE_ENV === "production"
        ? "https://name-the-pokemon.onrender.com"
        : "http://localhost:3001";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      socket.emit("createGame", newGameId);
    });

    socket.on("gameCreated", (data) => {
      router.push(`/multiplayer/${newGameId}`);
    });

    socket.on("error", (error) => {
      console.error("Error creating game:", error);
    });
  };

  const joinGame = () => {
    if (gameId) {
      router.push(`/multiplayer/${gameId}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-20 text-center">
      <h1 className="text-4xl font-bold mb-5">
        Multiplayer Mode
      </h1>
      <p className="text-lg mb-10">
        Create a new game and share the Game ID with a friend, or join an
        existing game.
      </p>
      <div className="space-y-4">
        <button
          onClick={createGame}
          className="bg-blue-500 hover:bg-blue-700 text-white text-lg font-bold py-2 px-4 rounded"
        >
          Create New Game
        </button>
        <p className="text-lg mb-4 font-bold">or</p>
        <div>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID..."
            className="border-2 border-gray-300 text-black bg-white h-10 px-3 py-5 rounded-lg text-md focus:outline-none focus:shadow-md mb-4 text-center w-[177px]"
          />
          <button
            onClick={joinGame}
            className="bg-green-500 hover:bg-green-700 text-white text-lg font-bold py-2 px-4 rounded ml-2"
          >
            Join Game
          </button>
        </div>
      </div>
    </main>
  );
}
