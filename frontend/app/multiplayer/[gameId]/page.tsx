'use client';

import MultiplayerGame from '../../components/MultiplayerGame';

export default function GamePage({ params }: { params: { gameId: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <MultiplayerGame gameId={params.gameId} />
    </main>
  );
}
