import { useState, useCallback } from 'react';

import useWorker from './hooks/useWorker';
import Analysis from './components/Analysis';
import WorldDisplay from './components/displays/WorldDisplay';
import MenuDisplay from './components/displays/MenuDisplay';
import { DEFAULT_BLOCKS } from './constants';
import './App.css';

const VIEWPORT_WIDTH = 16;
const VIEWPORT_HEIGHT = 8;

export default function App({ magnification=3 }) {
  // const [input, setInput] = useState('I love walking my dog.');

  // const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);

  // const { ready, request } = useWorker({
  //   onResult: ({ name, ...data }) => {
  //     // Update the block with the latest version and output
  //     const block = blocks.find((block) => block.name === name);
  //     if (!block || data.version < block.version) return;

  //     const { labels, scores } = data;
  //     Object.assign(block, data);  // version, labels, hypothesis
  //     block.output = Object.fromEntries(labels.map((label, i) =>
  //       [label, parseInt(scores[i].toFixed(2) * 100)]
  //     ));
  //     setBlocks([...blocks]);
  //   },
  // });

  // const analyze = (e, names) => {
  //   // Serialize each block and analyze it separately
  //   blocks
  //     .filter((block) => !names || names.includes(block.name))
  //     .forEach((block) => request({ text: input, ...block }));
  // };

  return (
    <>
      <h1>FM</h1>

      {/* Side-by-side divs */}
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        {/* <div>
          <textarea value={input} rows={3} onChange={e => setInput(e.target.value)}></textarea>
          <button onClick={analyze}>Analyze</button>
        </div> */}
        <WorldDisplay
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
        />
        <MenuDisplay
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
          options={[
            "New Game",
            "Load Game",
            "Settings",
            "Exit",
            "Help",
            "About",
            "Quit",
            "Save Game",
            "Resume",
            "Options",
            "Continue",
            "Restart",
          ]}
        />
      </div>

      {/* Horizontal row of cards */}
      {/* <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        {ready && (
          blocks.map((block, i) => (
            <div key={i} style={{width: 200, padding: 5}}>
              <Analysis {...block} />
            </div>
          ))
        )}
      </div> */}
    </>
  )
}
