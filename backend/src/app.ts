import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getRandomPokemon } from "../utils/getRandomPokemon";
import { pokemonData } from "../utils/data";

const app = express();
app.get("/", (_req, res) => {
  res.send("Welcome to the Name the Pokémon game server!");
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://www.namethepokemon.com"
        : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 3001;

const games = new Map();

io.on("connection", (socket) => {
  socket.on("createGame", async (gameId) => {
    const { selectedPokemon, pokemonNumber } = await getRandomPokemon();
    const options = generateOptions(selectedPokemon);
    games.set(gameId, {
      players: [],
      currentPokemon: selectedPokemon,
      pokemonNumber,
      options,
      currentQuestion: 1,
      totalQuestions: 10,
      answeredPlayers: [],
      isProcessingNextRound: false,
      gameStarted: false,
      createdAt: Date.now(),
    });
    socket.emit("gameCreated", { gameId });
    scheduleGameCleanup(gameId);
  });

  socket.on("joinGame", async ({ gameId }) => {
    const game = games.get(gameId);
    if (game) {
      if (game.players.length < 2) {
        const playerIndex = game.players.findIndex(
          (p: { id: string }) => p.id === socket.id
        );
        if (playerIndex === -1) {
          game.players.push({ id: socket.id, score: 0 });
        }
        socket.join(gameId);
        io.to(gameId).emit("gameJoined", {
          gameId,
          pokemonNumber: game.pokemonNumber,
          players: game.players,
          options: game.options,
          gameStarted: game.gameStarted,
        });
        if (game.players.length === 2) {
          game.gameStarted = true;
          io.to(gameId).emit("gameStarted", {
            gameId,
            pokemonNumber: game.pokemonNumber,
            players: game.players,
            options: game.options,
          });
          scheduleGameCleanup(gameId);
        }
      } else {
        socket.emit("gameFull");
      }
    } else {
      socket.emit("gameNotFound", {
        message: "Game not found or has expired.",
      });
    }
  });

  socket.on("submitAnswer", ({ gameId, answer, timeLeft }) => {
    const game = games.get(gameId);
    if (game && !game.answeredPlayers.includes(socket.id)) {
      const player = game.players.find(
        (p: { id: string }) => p.id === socket.id
      );
      if (player) {
        game.answeredPlayers.push(socket.id);
        if (
          answer &&
          answer.toLowerCase() === game.currentPokemon.toLowerCase()
        ) {
          let pointsEarned: number;
          if (timeLeft >= 9) {
            pointsEarned = 20;
          } else {
            pointsEarned = timeLeft + 11;
          }

          // double the points for the last question
          if (game.currentQuestion === game.totalQuestions) {
            pointsEarned *= 2;
          }

          player.score += pointsEarned;
          io.to(gameId).emit("correctAnswer", {
            playerId: socket.id,
            score: player.score,
            pointsEarned,
            correctAnswer: game.currentPokemon,
          });
        } else {
          io.to(gameId).emit("incorrectAnswer", { playerId: socket.id });
        }

        if (game.answeredPlayers.length === game.players.length) {
          io.to(gameId).emit("allPlayersAnswered", {
            correctAnswer: game.currentPokemon,
          });
          if (game.currentQuestion >= game.totalQuestions) {
            io.to(gameId).emit("gameFinished");
          } else {
            setTimeout(() => nextRound(gameId), 3000);
          }
        }
      }
    }
  });

  socket.on("nextRound", ({ gameId }) => {
    nextRound(gameId);
  });

  socket.on("disconnect", () => {
    Array.from(games.entries()).forEach(([gameId, game]) => {
      const playerIndex = game.players.findIndex(
        (p: { id: string }) => p.id === socket.id
      );
      if (playerIndex !== -1) {
        game.players[playerIndex].disconnected = true;
        io.to(gameId).emit("playerLeft", {
          gameId,
          players: game.players,
          disconnectedPlayerId: socket.id,
        });
        if (
          game.players.filter((p: { disconnected: boolean }) => !p.disconnected)
            .length < 2
        ) {
          io.to(gameId).emit("gameOver", { players: game.players });
          games.delete(gameId);
        }
      }
    });
  });

  socket.on("requestRematch", (gameId) => {
    const game = games.get(gameId);
    if (game) {
      const opponentSocket = game.players.find(
        (p: { id: string }) => p.id !== socket.id
      );
      if (opponentSocket) {
        io.to(opponentSocket.id).emit("rematchRequested", gameId);
      }
    }
  });

  socket.on("acceptRematch", async (oldGameId) => {
    const oldGame = games.get(oldGameId);
    if (oldGame) {
      const newGameId = Math.random().toString(36).substring(2, 8);
      const { selectedPokemon, pokemonNumber } = await getRandomPokemon();
      const options = generateOptions(selectedPokemon);
      const newGame = {
        players: [],
        currentPokemon: selectedPokemon,
        pokemonNumber,
        options,
        currentQuestion: 1,
        totalQuestions: 10,
        answeredPlayers: [],
        isProcessingNextRound: false,
        gameStarted: false,
        createdAt: Date.now(),
      };
      games.set(newGameId, newGame);

      const player1 = oldGame.players[0];
      const player2 = oldGame.players[1];

      const player1Socket = io.sockets.sockets.get(player1.id);
      if (player1Socket) {
        player1Socket.emit("createRematchGame", { gameId: newGameId });
      }

      const player2Socket = io.sockets.sockets.get(player2.id);
      if (player2Socket) {
        player2Socket.emit("joinRematchGame", { gameId: newGameId });
      }

      games.delete(oldGameId);
      scheduleGameCleanup(newGameId);
    }
  });

  socket.on("createRematchGame", async () => {
    const newGameId = Math.random().toString(36).substring(2, 8);
    const { selectedPokemon, pokemonNumber } = await getRandomPokemon();
    const options = generateOptions(selectedPokemon);
    games.set(newGameId, {
      players: [],
      currentPokemon: selectedPokemon,
      pokemonNumber,
      options,
      currentQuestion: 1,
      totalQuestions: 3,
      answeredPlayers: [],
      isProcessingNextRound: false,
      gameStarted: false,
      createdAt: Date.now(),
    });
    socket.emit("rematchCreated", { gameId: newGameId });
    scheduleGameCleanup(newGameId);
  });
});

async function nextRound(gameId: string | string[]) {
  const game = games.get(gameId);
  if (game && !game.isProcessingNextRound) {
    game.isProcessingNextRound = true;
    game.currentQuestion++;
    if (game.currentQuestion <= game.totalQuestions) {
      const { selectedPokemon, pokemonNumber } = await getRandomPokemon();
      const options = generateOptions(selectedPokemon);
      game.currentPokemon = selectedPokemon;
      game.pokemonNumber = pokemonNumber;
      game.options = options;
      game.answeredPlayers = [];
      io.to(gameId).emit("newRound", {
        pokemonNumber,
        options,
        currentQuestion: game.currentQuestion,
        totalQuestions: game.totalQuestions,
        correctAnswer: selectedPokemon,
      });
    } else {
      io.to(gameId).emit("gameOver", { players: game.players });
      games.delete(gameId);
    }
    game.isProcessingNextRound = false;
  }
}

function generateOptions(correctAnswer: string) {
  const allPokemon = Object.keys(pokemonData);
  const options = [correctAnswer];
  while (options.length < 4) {
    const randomPokemon =
      allPokemon[Math.floor(Math.random() * allPokemon.length)];
    if (!options.includes(randomPokemon)) {
      options.push(randomPokemon);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}

function scheduleGameCleanup(gameId: string) {
  setTimeout(() => {
    const game = games.get(gameId);
    if (game) {
      if (game.players.length === 0 || !game.gameStarted) {
        games.delete(gameId);
        io.to(gameId).emit("gameExpired");
      } else if (
        game.gameStarted &&
        game.currentQuestion > game.totalQuestions
      ) {
        games.delete(gameId);
      }
    }
  }, 5 * 60 * 1000);
}

server.listen(port, () => {
  console.log(`Server running on port ${port}!`);
});
