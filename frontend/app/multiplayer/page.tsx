"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

export default function MultiplayerPage() {
  const [gameId, setGameId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const createGame = async () => {
    setIsLoading(true);
    const newGameId = Math.random().toString(36).substring(2, 8);
    const socketUrl =
      process.env.NODE_ENV === "production"
        ? "https://name-the-pokemon.onrender.com"
        : "http://localhost:3001";
    const socket = io(socketUrl);

    const minLoadTime = new Promise((resolve) => setTimeout(resolve, 1000));

    const gameCreation = new Promise((resolve, reject) => {
      socket.on("connect", () => {
        socket.emit("createGame", newGameId);
      });

      socket.on("gameCreated", (data) => {
        resolve(data);
      });

      socket.on("error", (error) => {
        reject(error);
      });
    });

    try {
      await Promise.all([minLoadTime, gameCreation]);
      router.push(`/multiplayer/${newGameId}`);
    } catch (error) {
      console.error("Error creating game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async () => {
    if (gameId) {
      setIsJoining(true);
      const minJoinTime = new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        await minJoinTime;
        router.push(`/multiplayer/${gameId}`);
      } catch (error) {
        console.error("Error joining game:", error);
      } finally {
        setIsJoining(false);
      }
    }
  };

  const handleGameIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameId(e.target.value);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-20 text-center">
      <h1 className="text-4xl font-bold mb-5">Multiplayer Mode</h1>
      <p className="text-lg mb-10">
        Create a new game and share the Game ID with a friend, or join an
        existing game.
      </p>
      <div className="space-y-4">
        <button
          onClick={createGame}
          disabled={isLoading}
          className={`bg-blue-500 hover:bg-blue-700 text-white text-lg font-bold py-2 px-4 rounded min-w-[200px] ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating...
            </div>
          ) : (
            "Create New Game"
          )}
        </button>
        <p className="text-lg mb-4 font-bold">or</p>
        <div className="flex flex-col sm:flex-row items-center justify-center">
          <input
            type="text"
            value={gameId}
            onChange={handleGameIdChange}
            placeholder="Enter Game ID..."
            className="border-2 border-gray-300 text-black bg-white h-10 px-3 py-5 rounded-lg text-md focus:outline-none focus:shadow-md mb-4 text-center w-[177px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && gameId.length > 0) {
                joinGame();
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button
            onClick={joinGame}
            disabled={isJoining}
            className={`bg-green-500 hover:bg-green-700 text-white text-lg font-bold py-2 px-4 rounded ml-2 mb-4 ${
              isJoining ? "opacity-50 cursor-not-allowed" : ""
            } ${
              gameId.length === 0
                ? "hover:opacity-50 hover:cursor-not-allowed"
                : ""
            }`}
          >
            {isJoining ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              "Join Game"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
