import { cache } from 'react'
import { getRandomPokemon } from './getRandomPokemon'

export const getServerSidePokemon = cache(async () => {
  return await getRandomPokemon()
})
