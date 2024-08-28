import Link from 'next/link';
import BackgroundMusic from './components/BackgroundMusic';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <BackgroundMusic />
      <h1 className="text-4xl font-bold mb-6">Name the Pokémon!</h1>
      <p className="text-xl mb-8 max-w-2xl">
        Test your Pokémon knowledge with this exciting game! Identify Pokémon from their images, and earn points. Can you name them all?
      </p>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 mt-4">How to Play:</h2>
        <ul className="list-disc text-xl text-left inline-block">
          <li>You&apos;ll be shown an image of a Pokémon</li>
          <li>Choose the correct name from four options</li>
          <li>Answer quickly for more points</li>
          <li>Try to get the highest score possible!</li>
        </ul>
      </div>
      <div className="flex space-x-4 mt-5">
        <Link href="/single-player" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-xl transition duration-300">
          Single Player
        </Link>
        <Link href="/multiplayer" className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-xl transition duration-300">
          Multiplayer
        </Link>
      </div>
    </main>
  );
}
