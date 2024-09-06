"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import NameInput from "../components/NameInput";

export default function MultiplayerPage() {
  const [gameId, setGameId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  const createGame = async () => {
    setIsLoading(true);
    const newGameId = Math.random().toString(36).substring(2, 8);
    const socketUrl =
      process.env.NODE_ENV === "production"
        ? "https://name-the-pokemon.onrender.com"
        : "http://localhost:3001";
    const socket = io(socketUrl);

    const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000));

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

  const joinGame = () => {
    if (gameId) {
      router.push(`/multiplayer/${gameId}?action=join`);
    }
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
        <div>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID..."
            className="border-2 border-gray-300 text-black bg-white h-10 px-3 py-5 rounded-lg text-md focus:outline-none focus:shadow-md mb-4 text-center w-[177px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                joinGame();
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
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
