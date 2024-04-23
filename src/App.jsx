import { useState, useEffect } from 'react';

import StatsDisplay from './components/displays/StatsDisplay';
import WorldDisplay from './components/displays/WorldDisplay';
import MenuDisplay from './components/displays/MenuDisplay';
import Analysis from './components/Analysis';
import useAnalyzer from './hooks/useAnalyzer';

const START_WORLD = 'Terra Montans.txt'
const START_Y = 17;
const START_X = 35;

const VIEWPORT_WIDTH = 16;
const VIEWPORT_HEIGHT = 8;

export default function App({ magnification=3, startWorld=START_WORLD, startX=START_X, startY=START_Y }) {
  // const [input, setInput] = useState('I love walking my dog.');
  // const { ready, analyze, blocks } = useAnalyzer();

  const [interaction, setInteraction] = useState(null);
  const [menuChoice, setMenuChoice] = useState(null);
  const [targetData, setTargetData] = useState(null);

  const [destination, setDestination] = useState({ startWorld, startX, startY });

  // React to a destination event
  useEffect(() => {
    const destinationHandler = (e) => {
      const newLocation = {
        startY: e.detail.destination[0] - 1,
        startX: e.detail.destination[1] - 1,
      };
      if (e.detail.dataFile) {
        newLocation.startWorld = e.detail.dataFile;
      }
      setDestination((location) => ({...location, ...newLocation}));
    };
    window.addEventListener('destination', destinationHandler);
    return () => window.removeEventListener('destination', destinationHandler);
  }, []);

  // Store activated target event
  useEffect(() => {
    const interactionHandler = (e) => {
      setInteraction(e.detail);
    };
    window.addEventListener('interaction', interactionHandler);
    return () => window.removeEventListener('interaction', interactionHandler);
  }, []);

  // Store activated menu choice event
  useEffect(() => {
    const menuChoiceHandler = (e) => {
      setMenuChoice(e.detail);
    };
    window.addEventListener('menuChoice', menuChoiceHandler);
    return () => window.removeEventListener('menuChoice', menuChoiceHandler);
  }, []);

  // Load interaction data based on both the target and the menu choice
  useEffect(() => {
    if (!interaction || !menuChoice) return;
    const { label, dataFile } = interaction;
    if (!label || !dataFile) return;
    fetch(`${label}/${dataFile}`)
      .then((res) => res.text())
      .then((text) => {
        const items = text.split('---');
        const actions = {};
        items.forEach((item) => {
          const [category] = item.trim().split('\n', 1);
          actions[category] = item.slice(category.length + 1).trim();
        });
        setTargetData(actions);
      });
  }, [interaction, menuChoice]);

  return (
    <>
      <h1>FM</h1>

      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        <StatsDisplay
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
          keyMap={{
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            select: ' ',
            cancel: 'Escape',
          }}
        />
        <WorldDisplay
          {...destination}
          // startWorld={"Terra Montans.txt"}
          // startX={35}
          // startY={17}
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
          target={menuChoice ? interaction : null}
          keyMap={{
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            use: 'Enter',
          }}
        />
        <MenuDisplay
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
          target={interaction}
          targetData={targetData}
          activeChoice={menuChoice}
          options={[
            "Look",
            "Greet",
            "Intimidate",
            "Bribe",
            "Trade",
            "Fight",
          ]}
          keyMap={{
            down: 'j',
            up: 'k',
            pageDown: '=',
            pageUp: '-',
            use: 'Enter',
            cancel: 'Backspace',
          }}
        />
      </div>
      {/* <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch'}}>
        <input
          className="ti large"
          style={{flexGrow: 1}}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          className="ti inverted large"
          onClick={(e) => analyze(e, input)}
        >Analyze</button>
      </div> */}

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
