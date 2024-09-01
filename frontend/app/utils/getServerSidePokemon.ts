import { cache } from 'react'
import { getRandomPokemon } from './getRandomPokemon'

export const getServerSidePokemon = cache(async () => {
  const { selectedPokemon, pokemonNumber } = await getRandomPokemon();
  return { selectedPokemon, pokemonNumber };
})
