import { useState, useEffect } from 'react';

import DisplayStats from './components/DisplayStats';
import DisplayWorld from './components/DisplayWorld';
import DisplayMenu from './components/DisplayMenu';
import Analysis from './components/Analysis';
import useAnalyzer from './hooks/useAnalyzer';
import useInventory from './hooks/useInventory';
import useSave from './hooks/useSave';
import { TARGETED_ACTIONS, ACTIONS_ORDER } from './Actions';

const START_WORLD = 'Terra Montans.txt'
const START_Y = 17;
const START_X = 35;

const VIEWPORT_WIDTH = 16;
const VIEWPORT_HEIGHT = 8;

export default function App({
  startMagnification=2,
  beginWorld=START_WORLD,
  beginX=START_X,
  beginY=START_Y,
  startWidth=VIEWPORT_WIDTH,
  startHeight=VIEWPORT_HEIGHT,
}) {
  // const [input, setInput] = useState('I love walking my dog.');
  // const { ready, analyze, blocks } = useAnalyzer();

  const [magnification, setMagnification] = useState(startMagnification);
  const [interaction, setInteraction] = useState(null);
  const [menuChoice, setMenuChoice] = useState(null);
  const [targetData, setTargetData] = useState(null);
  const [width, setWidth] = useState(startWidth);
  const [height, setHeight] = useState(startHeight);
  const [startWorld, setStartWorld] = useState(beginWorld);
  const [startX, setStartX] = useState(beginX);
  const [startY, setStartY] = useState(beginY);
  const [activeOptions, setActiveOptions] = useState(ACTIONS_ORDER);

  const { inventory, equipment, equip, acquire } = useInventory('player');

  const statsKeyMap = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    select: ' ',
    cancel: 'Escape',
  };
  const worldKeyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    use: 'Enter',
  };
  const menuKeyMap = {
    down: 'j',
    up: 'k',
    pageDown: '=',
    pageUp: '-',
    use: 'Enter',
    cancel: 'Backspace',
  };

  useSave({
    magnification: [magnification, setMagnification],
    width: [width, setWidth],
    height: [height, setHeight],
    startWorld: [startWorld, setStartWorld],
    startX: [startX, setStartX],
    startY: [startY, setStartY],
  });

  // Respond to 'Load' menu choice event by throwing the real `load` event.
  useEffect(() => {
    const loadHandler = (e) => {
      const loadEvent = new CustomEvent('load', { detail: e.detail });
      window.dispatchEvent(loadEvent);
    };
    window.addEventListener('Load', loadHandler);
    return () => window.removeEventListener('Load', loadHandler);
  }, []);

  // Respond to 'menuChoice' event from menu and feed it back as stable state
  useEffect(() => {
    const menuChoiceHandler = (e) => {
      setMenuChoice(e.detail);
    };
    window.addEventListener('menuChoice', menuChoiceHandler);
    return () => window.removeEventListener('menuChoice', menuChoiceHandler);
  }, []);

  // Respond to 'interaction' event from world by saving it for other displays
  useEffect(() => {
    const interactionHandler = (e) => {
      setInteraction(e.detail);
    };
    window.addEventListener('interaction', interactionHandler);
    return () => window.removeEventListener('interaction', interactionHandler);
  }, []);

  // Respond to 'destination' event from world double bump
  useEffect(() => {
    const destinationHandler = (e) => {
      const newY = e.detail.destination[0] - 1;
      const newX = e.detail.destination[1] - 1;
      const newWorld = e.detail.dataFile && e.detail.dataFile;
      setStartWorld(newWorld || startWorld);
      setStartX(newX);
      setStartY(newY);
    };
    window.addEventListener('destination', destinationHandler);
    return () => window.removeEventListener('destination', destinationHandler);
  }, [startWorld]);

  // Prepare active menu choices based on the target's data
  useEffect(() => {
    if (!interaction) {
      setActiveOptions(ACTIONS_ORDER.filter((option) => !TARGETED_ACTIONS.includes(option)));
      return;
    };
    const newOptions = [];

    // Add official actions to the menu choices
    ACTIONS_ORDER.forEach((option) => {
      if (interaction[option]) {
        newOptions.push(option);
      }
    });

    // Add extra Capitalized actions from the target's data
    newOptions.push(...Object.keys(interaction).filter((option) => {
      if (newOptions.includes(option)) return false;
      return /^[A-Z]$/.test(option[0]);
    }));
    setActiveOptions(newOptions);
  }, [interaction]);

  // Load interaction data based on both the target and the menu choice
  useEffect(() => {
    if (!interaction || !menuChoice) return;
    setTargetData(interaction);
  }, [interaction, menuChoice]);

  return (
    <>
      <h1>FM</h1>
      <p>
        <label style={{ margin: '0 0 0 1em' }} htmlFor="magnification">Zoom: </label>
        <input id="magnification"
          type="number"
          value={magnification}
          onChange={(e) => setMagnification(Number(e.target.value))}
          style={{width: 50}}
        />
        <label style={{ margin: '0 0 0 1em' }} htmlFor="width">Width: </label>
        <input id="width"
          type="number"
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value))}
          style={{width: 50}}
        />
        <label style={{ margin: '0 0 0 1em' }} htmlFor="height">Height: </label>
        <input id="height"
          type="number"
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value))}
          style={{width: 50}}
        />
      </p>

      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
        <DisplayStats
          inventory={inventory}
          equipment={equipment}
          equip={equip}

          width={width}
          height={height}
          magnification={magnification}
          keyMap={statsKeyMap}
        />
        <DisplayWorld
          target={menuChoice ? interaction : null}

          inventory={inventory}
          equipment={equipment}
          equip={equip}
          acquire={acquire}

          startWorld={startWorld}
          startX={startX}
          startY={startY}
          width={width}
          height={height}
          magnification={magnification}
          keyMap={worldKeyMap}
        />
        <DisplayMenu
          target={interaction}
          targetData={targetData}
          activeChoice={menuChoice}
          options={activeOptions}

          inventory={inventory}
          equipment={equipment}
          acquire={acquire}

          width={width}
          height={height}
          magnification={magnification}
          keyMap={menuKeyMap}
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
