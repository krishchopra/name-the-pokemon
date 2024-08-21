import { pokemonData } from "./data";

export async function getRandomPokemon() {
  const pokemonNames = Object.keys(pokemonData);
  const selectedPokemon = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
  const randomPokemonNumber = pokemonData[selectedPokemon];
  const randomPokemonNumberString = randomPokemonNumber.toString().padStart(3, '0');
  const imageUrl = `https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/${randomPokemonNumberString}.png`;

  return { selectedPokemon, imageUrl };
}
