import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getRandomPokemon } from "../utils/getRandomPokemon";
import { pokemonData } from "../utils/data";

const app = express();
app.get('/', (req, res) => {
  res.send('Welcome to the Pokémon game server!');
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: process.env.NODE_ENV === 'production'
    //   ? "https://namethepokemon.vercel.app/"
    //   : "http://localhost:3000",
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 3001;

const games = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("createGame", async (gameId) => {
    console.log("Create game request:", gameId);
    const { selectedPokemon, imageUrl } = await getRandomPokemon();
    const options = generateOptions(selectedPokemon);
    games.set(gameId, {
      players: [],
      currentPokemon: selectedPokemon,
      imageUrl,
      options,
      currentQuestion: 1,
      totalQuestions: 10,
      answeredPlayers: [],
      isProcessingNextRound: false,
    });
    console.log('Game created:', gameId);
    socket.emit("gameCreated", { gameId });
  });

  socket.on("joinGame", async (gameId) => {
    console.log('Join game request:', gameId, 'from socket:', socket.id);
    const game = games.get(gameId);
    if (game) {
      console.log('Game found:', gameId, 'Current players:', game.players);
      if (game.players.length < 2) {
        game.players.push({ id: socket.id, score: 0 });
        socket.join(gameId);
        console.log('Player joined game:', gameId, 'New player list:', game.players);
        io.to(gameId).emit("gameJoined", { gameId, imageUrl: game.imageUrl, players: game.players, options: game.options });
        if (game.players.length === 2) {
          console.log('Game started:', gameId);
          io.to(gameId).emit("gameStarted", { gameId, imageUrl: game.imageUrl, players: game.players, options: game.options });
        }
      } else {
        console.log('Game full:', gameId);
        socket.emit("gameFull");
      }
    } else {
      console.log('Game not found:', gameId);
      socket.emit("gameNotFound");
    }
  });

  socket.on("submitAnswer", ({ gameId, answer }) => {
    console.log('Answer submitted:', gameId, answer, 'from socket:', socket.id);
    const game = games.get(gameId);
    if (game && !game.answeredPlayers.includes(socket.id)) {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        game.answeredPlayers.push(socket.id);
        if (answer && answer.toLowerCase() === game.currentPokemon.toLowerCase()) {
          player.score += 1;
          console.log('Correct answer:', gameId, 'Player:', socket.id, 'New score:', player.score);
          io.to(gameId).emit("correctAnswer", { playerId: socket.id, score: player.score, correctAnswer: game.currentPokemon });
        } else {
          console.log('Incorrect answer:', gameId, 'Player:', socket.id);
          io.to(gameId).emit("incorrectAnswer", { playerId: socket.id });
        }

        if (game.answeredPlayers.length === game.players.length) {
          io.to(gameId).emit("allPlayersAnswered", { correctAnswer: game.currentPokemon });
          setTimeout(() => nextRound(gameId), 3000);
        }
      }
    }
  });

  socket.on("nextRound", ({ gameId }) => {
    nextRound(gameId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Array.from(games.entries()).forEach(([gameId, game]) => {
      game.players = game.players.filter((p) => p.id !== socket.id);
      if (game.players.length === 0) {
        console.log('Game deleted:', gameId);
        games.delete(gameId);
      } else {
        console.log('Player left game:', gameId, 'Remaining players:', game.players);
        io.to(gameId).emit("playerLeft", { players: game.players });
      }
    });
  });
});

async function nextRound(gameId) {
  const game = games.get(gameId);
  if (game && !game.isProcessingNextRound) {
    game.isProcessingNextRound = true;
    game.currentQuestion++;
    if (game.currentQuestion <= game.totalQuestions) {
      const { selectedPokemon, imageUrl } = await getRandomPokemon();
      const options = generateOptions(selectedPokemon);
      game.currentPokemon = selectedPokemon;
      game.imageUrl = imageUrl;
      game.options = options;
      game.answeredPlayers = [];
      io.to(gameId).emit("newRound", { 
        imageUrl, 
        options, 
        currentQuestion: game.currentQuestion, 
        totalQuestions: game.totalQuestions,
        correctAnswer: selectedPokemon
      });
    } else {
      io.to(gameId).emit("gameOver", { players: game.players });
      games.delete(gameId);
    }
    game.isProcessingNextRound = false;
  }
}

function generateOptions(correctAnswer) {
  const allPokemon = Object.keys(pokemonData);
  const options = [correctAnswer];
  while (options.length < 4) {
    const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
    if (!options.includes(randomPokemon)) {
      options.push(randomPokemon);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}

server.listen(port, () => {
  console.log(`Server running on port ${port}!`);
});
