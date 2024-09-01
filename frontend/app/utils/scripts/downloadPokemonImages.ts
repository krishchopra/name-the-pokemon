// npx ts-node app/utils/scripts/downloadPokemonImages.ts

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pokemonData } = require('../data');

const downloadPokemonImages = async () => {
  const baseUrl = 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/';
  const outputFolder = path.join(process.cwd(), 'public', 'images');

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  for (const [pokemonName, pokemonNumber] of Object.entries(pokemonData) as [string, number][]) {
    if (pokemonNumber < 21 || pokemonNumber > 30) continue;

    const paddedNumber = pokemonNumber.toString().padStart(3, '0');
    const imageUrl = `${baseUrl}${paddedNumber}.png`;
    const outputPath = path.join(outputFolder, `${paddedNumber}.png`);

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, response.data);
      console.log(`Downloaded: ${pokemonName} (${paddedNumber})`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error downloading ${pokemonName} (${paddedNumber}):`, error.message);
      } else {
        console.error(`Error downloading ${pokemonName} (${paddedNumber}):`, String(error));
      }
    }
  }

  console.log('Download complete!');
};

downloadPokemonImages();
