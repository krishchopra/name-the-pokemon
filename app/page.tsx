import Image from "next/image";
import { pokemonData } from "./utils/data";
import MultipleChoice from "./components/MultipleChoice";
import { getServerSidePokemon } from "./utils/getServerSidePokemon";

export const revalidate = 0; // disables caching for this page -- consider taking out in future!

export default async function Home() {
  const { selectedPokemon, imageUrl } = await getServerSidePokemon();
  const allPokemon = Object.keys(pokemonData);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <MultipleChoice correctAnswer={selectedPokemon} allPokemon={allPokemon} imageUrl={imageUrl} />
    </main>
  );
}
