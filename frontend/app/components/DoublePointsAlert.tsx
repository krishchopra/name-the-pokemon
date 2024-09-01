import { useState, useEffect } from "react";

interface DoublePointsAlertProps {
  onFinish: () => void;
}

export default function DoublePointsAlert({
  onFinish,
}: DoublePointsAlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true);
    }, 500);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 1000); // wait for fade-out animation before calling onFinish
    }, 3500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 transition-opacity duration-1000 px-4 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-yellow-400 text-black text-3xl font-medium p-8 rounded-lg shadow-lg animate-pulse max-w-sm w-full text-center">
        Final Question
        <br />
        <span className="font-extrabold">2x Points!</span>
      </div>
    </div>
  );
}
