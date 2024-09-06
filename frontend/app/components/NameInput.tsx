import { useState, useEffect } from "react";

interface NameInputProps {
  onNameChange: (name: string) => void;
}

export default function NameInput({ onNameChange }: NameInputProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setName(storedName);
      onNameChange(storedName);
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    localStorage.setItem('playerName', newName);
  };

  const handleNameBlur = () => {
    onNameChange(name);
  };

  return (
    <input
      type="text"
      value={name}
      onChange={handleNameChange}
      onBlur={handleNameBlur}
      placeholder="Enter your name..."
      className="border-2 border-gray-300 text-black bg-white h-10 px-3 rounded-lg text-md focus:outline-none focus:shadow-md mb-4 w-[170px]"
    />
  );
}

