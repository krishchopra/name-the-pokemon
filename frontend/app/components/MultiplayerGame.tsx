"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import DoublePointsAlert from "./DoublePointsAlert";
import SoundEffects from "./SoundEffects";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MultiplayerGame({ gameId }: { gameId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<
    { id: string; score: number; disconnected?: boolean }[]
  >([]);
  const [pokemonNumber, setPokemonNumber] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [gameStatus, setGameStatus] = useState<
    "countdown" | "waiting" | "playing" | "finished" | "notFound"
  >("waiting");
  const router = useRouter();
  const soundEffectsRef = useRef<{
    playCorrectSound: () => void;
    playWrongSound: () => void;
  } | null>(null);
  const [showDoublePointsAlert, setShowDoublePointsAlert] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [allPlayersFinished, setAllPlayersFinished] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const totalQuestions = 10;
  const maxScore = 220;
  const calculateProgressPercentage = (score: number) =>
    (score / maxScore) * 100;

  useEffect(() => {
    const socketUrl =
      process.env.NODE_ENV === "production"
        ? "https://name-the-pokemon.onrender.com"
        : "http://localhost:3001";
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinGame", { gameId });
    });

    newSocket.on("rematchRequested", () => {
      setRematchRequested(true);
      toast.info("Opponent requested a rematch. Click 'Rematch' to accept.");
    });

    newSocket.on("rematchAccepted", (newGameId) => {
      router.push(`/multiplayer/${newGameId}`);
    });

    newSocket.on("rematchStarted", (gameData) => {
      setPokemonNumber(gameData.pokemonNumber);
      setOptions(gameData.options);
      setCurrentQuestion(gameData.currentQuestion);
      setCorrectAnswer(gameData.correctAnswer);
      setIsRevealed(false);
      setSelectedOption(null);
      setTimeLeft(10);
      setGameStatus("playing");
      setAllPlayersFinished(false);
      setRematchRequested(false);
      setPlayers(gameData.players);
      setGameStarted(true);
    });

    newSocket.on("gameCreated", (data) => {
      setGameStatus("waiting");
      setGameStarted(false);
      setPlayers([]);
      setPokemonNumber("");
      setOptions([]);
      setCurrentQuestion(1);
      setAllPlayersFinished(false);
      setRematchRequested(false);
    });

    newSocket.on("gameJoined", (data) => {
      setPlayers(data.players);
      setPokemonNumber(data.pokemonNumber);
      setOptions(data.options);
      setGameStatus("waiting");
      setGameStarted(data.gameStarted);
    });

    newSocket.on("gameStarted", (data) => {
      setPlayers(data.players);
      setPokemonNumber(data.pokemonNumber);
      setOptions(data.options);
      setGameStatus("countdown");
      setCountdown(5);
      setGameStarted(true);
    });

    newSocket.on("newRound", (data) => {
      setCurrentQuestion(data.currentQuestion);
      setOptions(data.options);
      setSelectedOption(null);
      setIsRevealed(false);
      setTimeLeft(10);
      setCorrectAnswer(data.correctAnswer);

      if (data.currentQuestion === totalQuestions) {
        setShowDoublePointsAlert(true);
        setTimeout(() => {
          setShowDoublePointsAlert(false);
          setPokemonNumber(data.pokemonNumber);
        }, 4500);
      } else {
        setPokemonNumber(data.pokemonNumber);
      }

      if (data.currentQuestion > totalQuestions) {
        setAllPlayersFinished(true);
      }
    });

    newSocket.on("correctAnswer", (data) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) =>
          p.id === data.playerId ? { ...p, score: data.score } : p
        )
      );
      setCorrectAnswer(data.correctAnswer);
      if (data.playerId === newSocket.id) {
        soundEffectsRef.current?.playCorrectSound();
      }
    });

    newSocket.on("incorrectAnswer", (data) => {
      if (data.playerId === newSocket.id) {
        soundEffectsRef.current?.playWrongSound();
      }
    });

    newSocket.on("allPlayersAnswered", (data) => {
      setIsRevealed(true);
      if (data && data.correctAnswer) {
        setCorrectAnswer(data.correctAnswer);
      }
    });

    newSocket.on("playerLeft", (data) => {
      if (data.gameId === gameId) {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) => ({
            ...player,
            disconnected: player.id === data.disconnectedPlayerId,
          }))
        );
        setGameStatus("finished");
      }
    });

    newSocket.on("disconnect", () => {
      setGameStatus("finished");
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.on("gameFinished", () => {
      setAllPlayersFinished(true);
    });

    newSocket.on("gameNotFound", (data) => {
      setGameStatus("notFound");
      toast.error(data?.message || "Game not found or has expired.");
    });

    newSocket.on("gameExpired", () => {
      setGameStatus("notFound");
      toast.error("This game has expired. Please join or create a new game.");
      router.push("/multiplayer");
    });

    newSocket.on("rematchCreated", (data) => {
      const newGameId = data.gameId;
      router.push(`/multiplayer/${newGameId}`);
    });

    newSocket.on("gameStarted", (data) => {
      setPlayers(data.players);
      setPokemonNumber(data.pokemonNumber);
      setOptions(data.options);
      setGameStatus("countdown");
      setCountdown(5);
      setGameStarted(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, router]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setGameStatus("playing");
      setTimeLeft(10);
      setCurrentQuestion(1);
    }
  }, [countdown]);

  useEffect(() => {
    if (
      timeLeft > 0 &&
      !isRevealed &&
      gameStatus === "playing" &&
      !showDoublePointsAlert
    ) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isRevealed && gameStatus === "playing") {
      handleOptionClick(null);
    }
  }, [timeLeft, isRevealed, gameStatus, showDoublePointsAlert]);

  const handleOptionClick = (option: string | null) => {
    if (isRevealed || gameStatus !== "playing") return;
    setSelectedOption(option);
    setIsRevealed(true);
    submitAnswer(option);
  };

  const submitAnswer = (option: string | null) => {
    if (socket) {
      socket.emit("submitAnswer", {
        gameId,
        answer: option,
        currentQuestion,
        timeLeft,
      });
    }
  };

  const handleCopyLink = () => {
    const gameLink = `${window.location.origin}/multiplayer/${gameId}`;
    navigator.clipboard.writeText(gameLink).then(() => {
      toast.success("Game link copied to clipboard!");
    });
  };

  const handleRematch = () => {
    if (socket) {
      if (rematchRequested) {
        socket.emit("acceptRematch", gameId);
      } else {
        socket.emit("requestRematch", gameId);
        setRematchRequested(true);
        toast.info("Rematch requested. Waiting for opponent...");
      }
    }
  };

  if (gameStatus === "notFound") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Game not found!</h1>
        <p className="text-lg mb-2">
          This game link is inactive or has expired.
        </p>
        <button
          onClick={() => router.push("/multiplayer")}
          className="mt-8 py-2 px-6 bg-blue-500 text-white rounded-full hover:bg-blue-700 font-bold text-lg"
        >
          Back to Multiplayer Menu
        </button>
        <ToastContainer />
      </div>
    );
  }

  if (gameStatus === "waiting" || gameStatus === "countdown") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          {gameStatus === "waiting"
            ? gameStarted
              ? "Waiting for the other player to rejoin..."
              : "Waiting for another player to join..."
            : "Get ready! Match starts in..."}
        </h1>
        {gameStatus === "countdown" && (
          <div className="text-6xl font-bold mb-4">{countdown}</div>
        )}
        {gameStatus === "waiting" && !gameStarted && (
          <>
            <p className="mb-6 text-lg">Game ID: {gameId}</p>
            <div className="flex justify-center">
              <button
                onClick={handleCopyLink}
                className="mt-1 p-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                Copy Game Link
              </button>
            </div>
          </>
        )}
        <ToastContainer />
      </div>
    );
  }

  if (gameStatus === "finished") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Game Over!</h1>
        <p>The other player left the game.</p>
        <div className="mt-10">
          <p className="text-lg mb-3 text-left">
            <span className="font-bold text-xl">Final Scores:</span>
          </p>
          {players.map((player, index) => (
            <p key={player.id} className="text-left">
              <span className="font-bold">{`Player ${index + 1}`}:</span>{" "}
              {player.score} {player.disconnected ? "(Disconnected)" : ""}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center -mt-7">
      <SoundEffects ref={soundEffectsRef} />
      {showDoublePointsAlert ? (
        <DoublePointsAlert onFinish={() => setShowDoublePointsAlert(false)} />
      ) : (
        <>
          <div className="flex justify-between mb-5 mt-3 bg-gray-500 rounded">
            <p className="text-white px-3 py-1 rounded">
              <span className="font-bold">Time:</span> {timeLeft}s
            </p>
            <p className="text-white px-3 py-1 rounded">
              <span className="font-bold">Question:</span> {currentQuestion}/
              {totalQuestions}
            </p>
          </div>
          <div className="mb-4 flex items-center space-x-6">
            <p className="w-26">
              <span className="font-bold">Player 1:</span>{" "}
              {players[0]?.score || 0}
            </p>
            <div className="flex-grow bg-gray-400 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${calculateProgressPercentage(
                    players[0]?.score || 0
                  )}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="flex justify-center mt-4 relative">
            <Image
              key={pokemonNumber}
              src={`/images/${pokemonNumber}.png`}
              alt="Pokemon"
              width={200}
              height={200}
              loading="eager"
              className={`animate-fade-in ${
                showDoublePointsAlert ? "invisible" : "visible"
              }`}
              unoptimized={true}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={isRevealed}
                className={`p-2 text-white rounded min-w-[200px] ${
                  isRevealed
                    ? option === correctAnswer
                      ? "bg-green-600"
                      : selectedOption === option
                      ? "bg-red-600"
                      : "bg-gray-500"
                    : "bg-blue-700 hover:bg-blue-900"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center space-x-6">
            <p className="w-26">
              <span className="font-bold">Player 2:</span>{" "}
              {players[1]?.score || 0}
            </p>
            <div className="flex-grow bg-gray-400 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${calculateProgressPercentage(
                    players[1]?.score || 0
                  )}%`,
                }}
              ></div>
            </div>
          </div>
          {allPlayersFinished && (
            <div>
              <p className="mt-8 text-lg">
                <span className="font-bold">Game over!</span>
                {players[0].score > players[1].score
                  ? ` Player 1 wins, with ${players[0].score} out of 220 points!`
                  : players[1].score > players[0].score
                  ? ` Player 2 wins, with ${players[1].score} out of 220 points!`
                  : " It's a tie!"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center">
                <button
                  onClick={handleRematch}
                  className="p-2 m-2 font-bold bg-blue-600 text-white rounded hover:bg-blue-800 flex-grow-0"
                >
                  Rematch
                </button>
                <button
                  onClick={() => router.push("/multiplayer")}
                  className="p-2 m-2 font-bold bg-green-600 text-white rounded hover:bg-green-700 flex-grow-0"
                >
                  New Game
                </button>
              </div>
            </div>
          )}
          <ToastContainer />
        </>
      )}
    </div>
  );
}
