import { pokemonData } from "../utils/data";
import MultipleChoice from "../components/MultipleChoice";
import { getServerSidePokemon } from "../utils/getServerSidePokemon";

export const revalidate = 0; // disables caching for this page -- consider taking out in the future!

export default async function Home() {
  const { selectedPokemon, pokemonNumber } = await getServerSidePokemon();
  const allPokemon = Object.keys(pokemonData);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <MultipleChoice correctAnswer={selectedPokemon} allPokemon={allPokemon} pokemonNumber={pokemonNumber} />
    </main>
  );
}
