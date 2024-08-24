import { useState, useEffect } from 'react';

interface DoublePointsAlertProps {
  onFinish: () => void;
}

export default function DoublePointsAlert({ onFinish }: DoublePointsAlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 1000); // wait for fade-out animation before calling onFinish
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-yellow-400 text-black text-2xl font-bold p-6 rounded-lg shadow-lg">
        Final Question: 2x Points!
      </div>
    </div>
  );
}
