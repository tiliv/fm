import { useState, useEffect } from 'react';

import DisplayStats from './components/DisplayStats';
import DisplayWorld from './components/DisplayWorld';
import DisplayMenu from './components/DisplayMenu';
import Analysis from './components/Analysis';
import useAnalyzer from './hooks/useAnalyzer';
import useInventory from './hooks/useInventory';
import useSave from './hooks/useSave';

const START_WORLD = 'Terra Montans.txt'
const [START_Y, START_X] = [20, 39];
const START_LOG = [
  "You've never been this tired before.",
  'You wake up in a small room, the walls are made of stone and the floor is dirt.',
];

const VIEWPORT_WIDTH = 16;
const VIEWPORT_HEIGHT = 8;

const KEYMAP_STATS = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd',
  select: ' ',
  cancel: 'Escape',
};
const KEYMAP_WORLD = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};
const KEYMAP_MENU = {
  down: 'j',
  up: 'k',
  pageDown: '=',
  pageUp: '-',
  use: 'Enter',
  cancel: 'Backspace',
};

export default function App({
  startMagnification=2,
  beginWorld=START_WORLD,
  beginX=START_X - 1,
  beginY=START_Y - 1,
  startWidth=VIEWPORT_WIDTH,
  startHeight=VIEWPORT_HEIGHT,
}) {
  // const [input, setInput] = useState('I love walking my dog.');
  // const { ready, analyze, blocks } = useAnalyzer();

  const [magnification, setMagnification] = useState(startMagnification);
  const [width, setWidth] = useState(startWidth);
  const [height, setHeight] = useState(startHeight);
  const [startWorld, setStartWorld] = useState(beginWorld);
  const [startX, setStartX] = useState(beginX);
  const [startY, setStartY] = useState(beginY);
  const [ambientMenu, setAmbientMenu] = useState([]);
  const [battle, setBattle] = useState(null);

  const [interaction, setInteraction] = useState(null);
  const {
    stats,
    inventory, equipment, log,
    handlers,
  } = useInventory('player', { startLog: START_LOG });

  useSave({
    magnification: [magnification, setMagnification],
    width: [width, setWidth],
    height: [height, setHeight],
    startWorld: [startWorld, setStartWorld],
    startX: [startX, setStartX],
    startY: [startY, setStartY],
  });

  // Respond to 'interaction' event from world by saving it for other displays
  useEffect(() => {
    const interactionHandler = ({ detail: interaction }) => {
      if (!interaction) {
        setInteraction(null);
        return;
      }
      const { start=null, ...startInteraction } = interaction;
      if (start) {
        Object.assign(startInteraction, {
          [start]: { ...startInteraction[start], start: true },
        });
      }
      setInteraction(startInteraction);
    };
    window.addEventListener('interaction', interactionHandler);
    return () => window.removeEventListener('interaction', interactionHandler);
  }, []);

  // Respond to 'Fight' event
  useEffect(() => {
    const fightHandler = ({ detail: battle }) => {
      setBattle(battle);
      setInteraction(null);
    };
    window.addEventListener('Fight', fightHandler);
    return () => window.removeEventListener('Fight', fightHandler);
  }, []);

  // Respond to 'Sheathe' event
  useEffect(() => {
    const sheatheHandler = () => {
      setBattle(null);
      setInteraction(null);
    };
    window.addEventListener('Sheathe', sheatheHandler);
    return () => window.removeEventListener('Sheathe', sheatheHandler);
  }, []);

  // Set up world
  useEffect(() => {
    setAmbientMenu([{
      title: startWorld.replace(/\.txt$/, '').toUpperCase(),
      items: [
        battle && {name: 'Sheathe', event: 'Sheathe'},
        {name: 'Wait', event: 'Wait'},
        {name: 'Shout', event: 'Ambient'},
        {name: 'Hide', event: 'Ambient'},
      ].filter(Boolean),
    }]);

    // Respond to 'destination' event from world double bump
    const destinationHandler = ({ detail: { destination: [r, c], dataFile }}) => {
      setStartWorld(dataFile || startWorld);
      setStartY(r - 1);
      setStartX(c - 1);
    };
    window.addEventListener('destination', destinationHandler);
    return () => window.removeEventListener('destination', destinationHandler);
  }, [startWorld, battle]);

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
          {...stats.current}
          inventory={inventory}
          equipment={equipment}
          equip={handlers.current.equip}
          log={log}

          width={width}
          height={height}
          magnification={magnification}
          keyMap={KEYMAP_STATS}
        />
        <DisplayWorld
          battle={battle}
          target={interaction}

          possesses={handlers.current.possesses}

          startWorld={startWorld}
          startX={startX}
          startY={startY}
          width={width}
          height={height}
          magnification={magnification}
          keyMap={KEYMAP_WORLD}
        />
        <DisplayMenu
          target={interaction}
          gold={stats.current.gold}
          ambientMenu={ambientMenu}

          inventory={inventory}
          equipment={equipment}
          acquire={handlers.current.acquire}

          width={width}
          height={height}
          magnification={magnification}
          keyMap={KEYMAP_MENU}
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
