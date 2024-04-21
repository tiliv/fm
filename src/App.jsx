import { useState, useEffect } from 'react';

import WorldDisplay from './components/displays/WorldDisplay';
import MenuDisplay from './components/displays/MenuDisplay';
import Analysis from './components/Analysis';
import useAnalyzer from './hooks/useAnalyzer';
import './App.css';

const VIEWPORT_WIDTH = 16;
const VIEWPORT_HEIGHT = 8;

export default function App({ magnification=2 }) {
  const [input, setInput] = useState('I love walking my dog.');
  const { ready, analyze, blocks } = useAnalyzer();

  const [interaction, setInteraction] = useState(null);
  const [menuChoice, setMenuChoice] = useState(null);
  useEffect(() => {
    const interactionHandler = (e) => {
      setInteraction(e.detail);
    };
    window.addEventListener('interaction', interactionHandler);
    return () => window.removeEventListener('interaction', interactionHandler);
  }, []);

  useEffect(() => {
    const menuChoiceHandler = (e) => {
      setMenuChoice(e.detail);
    };
    window.addEventListener('menuChoice', menuChoiceHandler);
    return () => window.removeEventListener('menuChoice', menuChoiceHandler);
  }, []);

  // useEffect(() => {
  //   console.log(menuChoice, interaction);
  // }, [interaction, menuChoice]);

  return (
    <>
      <h1>FM</h1>

      {/* Side-by-side divs */}
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        <WorldDisplay
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
        />
        <MenuDisplay
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          magnification={magnification}
          target={interaction}
          options={[
            "Greet",
            "Intimidate",
            "Bribe",
            "Trade",
            "Fight",
          ]}
        />
      </div>
      <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch', width: '100%'}}>
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
      </div>

      {/* Horizontal row of cards */}
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        {ready && (
          blocks.map((block, i) => (
            <div key={i} style={{width: 200, padding: 5}}>
              <Analysis {...block} />
            </div>
          ))
        )}
      </div>
    </>
  )
}
