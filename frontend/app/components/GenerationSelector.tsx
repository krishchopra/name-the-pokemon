import React from 'react';

interface GenerationSelectorProps {
  selectedGenerations: number[];
  onGenerationToggle: (gen: number) => void;
}

const GenerationSelector: React.FC<GenerationSelectorProps> = ({
  selectedGenerations,
  onGenerationToggle,
}) => {
  const generations = [
    { gen: 1, range: '1-151' },
    { gen: 2, range: '152-251' },
    { gen: 3, range: '252-386' },
    { gen: 4, range: '387-493' },
    { gen: 5, range: '494-649' },
    { gen: 6, range: '650-721' },
    { gen: 7, range: '722-809' },
    { gen: 8, range: '810-905' },
    { gen: 9, range: '906-1025' },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {generations.map(({ gen, range }) => (
        <button
          key={gen}
          className={`px-3 py-1 rounded ${
            selectedGenerations.includes(gen)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => onGenerationToggle(gen)}
        >
          Gen {gen} ({range})
        </button>
      ))}
    </div>
  );
};

export default GenerationSelector;
