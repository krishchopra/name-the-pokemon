import Image from "next/image";
import { getRandomPokemon } from "./utils/getRandomPokemon";

export default async function Home() {
  const { selectedPokemon, imageUrl } = await getRandomPokemon();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Who&rsquo;s that Pokémon?</h1>
        <p className="mt-6 text-2xl">{selectedPokemon}</p>
        <div className="flex justify-center mt-4">
          <Image src={imageUrl} alt={selectedPokemon} width={200} height={200} />
        </div>
      </div>
    </main>
  );
}
