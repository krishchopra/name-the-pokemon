interface TimerAndScoreProps {
  timeLeft: number;
  score: number;
  totalQuestions: number;
  currentQuestion: number;
}

export default function TimerAndScore({ timeLeft, score, totalQuestions, currentQuestion }: TimerAndScoreProps) {
  const maxScore = 220;
  const progressPercentage = (score / maxScore) * 100;

  return (
    <div className="mb-10">
      <div className="flex justify-between mb-3">
        <div className="mx-4"><span className="font-bold">Time:</span> {timeLeft}s</div>
        <div className="mx-4"><span className="font-bold">Score:</span> {score}</div>
        <div className="mx-4"><span className="font-bold">Question:</span> {currentQuestion}/{totalQuestions}</div>
      </div>
      <div className="w-full bg-gray-400 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
