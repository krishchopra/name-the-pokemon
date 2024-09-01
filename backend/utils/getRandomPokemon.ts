import { pokemonData } from "./data";

export async function getRandomPokemon() {
  const pokemonNames = Object.keys(pokemonData);
  const selectedPokemon = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
  const randomPokemonNumber = pokemonData[selectedPokemon];
  const pokemonNumber = randomPokemonNumber.toString().padStart(3, '0');

  return { selectedPokemon, pokemonNumber };
}
