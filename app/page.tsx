import Image from "next/image";
import { pokemonData } from "./components/data";

export default function Home() {
  const pokemonNames = Object.keys(pokemonData);
  const randomPokemon = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
  const randomPokemonNumber = pokemonData[randomPokemon];
  const randomPokemonNumberString = randomPokemonNumber.toString().padStart(3, '0');
  const imageUrl = `https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/${randomPokemonNumberString}.png`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Who's that Pokémon?</h1>
        <p className="mt-4 text-2xl">{randomPokemon}</p>
        <div className="flex justify-center mt-4">
          <Image src={imageUrl} alt={randomPokemon} width={200} height={200} />
        </div>
      </div>
    </main>
  );
}
