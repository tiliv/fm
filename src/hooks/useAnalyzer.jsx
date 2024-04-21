import { useState } from 'react';

import useWorker from './useWorker';

export default function useAnalyzer() {
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);

  const { ready, request } = useWorker({
    onResult: ({ name, ...data }) => {
      // Update the block with the latest version and output
      const block = blocks.find((block) => block.name === name);
      if (!block || data.version < block.version) return;

      const { labels, scores } = data;
      Object.assign(block, data);  // version, labels, hypothesis
      block.output = Object.fromEntries(labels.map((label, i) =>
        [label, parseInt(scores[i].toFixed(2) * 100)]
      ));
      setBlocks([...blocks]);
    },
  });

  const analyze = (e, input, names) => {
    // Serialize each block and analyze it separately
    blocks
      .filter((block) => !names || names.includes(block.name))
      .forEach((block) => request({ text: input, ...block }));
  };

  return {
    ready,
    analyze,
    blocks,
  };
}

const DEFAULT_BLOCKS = [
  { name: "Costs", version: 0, output: {},
    hypothesis: "Compared to a price of $5, this cost is {}",
    labels: [
      "less",
      "more",
    ]},
  { name: "Occupation", version: 0, output: {},
    hypothesis: "This person {}",
    labels: [
      "rents rooms",
      "sells goods",
      "is a personal trainer",
      "does something else",
    ]},
  // { name: "Scope", version: 0, output: {},
  //   hypothesis: "The subject is {}",
  //   labels: [
  //     "the speaker",
  //     "another person",
  //     "an animal",
  //     "an occupation",
  //     "an object",
  //     "a place",
  //     "something else",
  //   ]},
  // { name: "Mode", version: 0, output: {},
  //   hypothesis: "This text is about {}",
  //   labels: [
  //     "people",
  //     "animals",
  //     "environments",
  //     "currency",
  //     "feelings",
  //     "something else",
  //   ]},
  // { name: "Stats", version: 0, output: {},
  //   hypothesis: "This text is about {}",
  //   labels: [
  //     "health",
  //     "stamina",
  //     "something else",
  //   ]},
  // { name: "Equipment", version: 0, output: {},
  //   hypothesis: "This text is about {}",
  //   labels: [
  //     "swords",
  //     "guns",
  //     "armor",
  //     "fists",
  //     "something else",
  //   ]},
  // { name: "Mood", version: 0, output: {},
  //   hypothesis: "This behavior is usually {}",
  //   labels: [
  //     "relaxing",
  //     "aggresive",
  //     "careful",
  //     "happy",
  //     "something else",
  //   ]},
];
