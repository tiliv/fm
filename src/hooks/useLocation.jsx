import { useState, useEffect } from 'react';

import usePosition from './usePosition';
import useWorld from './useWorld';
import { parseInteraction, TYPES } from '../interactions';

export default function useLocation({
  battle, world, x, y,
  width, height, possesses,
  keyMap={},
}) {
  const { map, size, walls, interactions, zones } = useWorld({ world });
  const { marker, zone, bump, x: posX, y: posY } = usePosition({
    defaultX: x, defaultY: y,
    map, walls, interactions, zones, possesses,
    keyMap,
  });

  const [area, setArea] = useState([]);
  const [solid, setSolid] = useState([]);
  const [passable, setPassable] = useState([]);
  const [objects, setObjects] = useState([]);
  const [foreground, setForeground] = useState([]);
  const [background1, setBackground1] = useState([]);
  const [background2, setBackground2] = useState([]);
  const [hydratedInteractions, setHydratedInteractions] = useState({});

  const [position, setPosition] = useState({ x: posX, y: posY });
  const [local, setLocal] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const localX = posX % width;
  const localY = posY % height;
  const originX = posX - localX;
  const originY = posY - localY;

  // Determine 'area' from current viewport and do a deeper load of visible
  // interactions.
  useEffect(() => {
    setArea(map.slice(originY, originY + height).map(
      (row) => row.slice(originX, originX + width)
    ));

    const name = localStorage.getItem('latest');

    // Hydrate interactions on this viewport
    Promise.all(
      Object.entries(interactions).concat(Object.entries(walls))
      .map(async ([key, interaction]) => {
        if (key.includes(',')) {
          const [y, x] = key.split(',').map(Number);
          if ((x < originX || x >= originX + width) || (y < originY || y >= originY + height)) {
            return [null, null];
          }
        }
        const attributes = interaction.attributes || {};
        const context = { ...attributes, name, possesses };
        const { type, label, dataFile } = interaction;
        let text = '';
        if (type === TYPES.NPC) {
          text = await fetch(`interactions/${label}/${dataFile}`)
            .then((res) => res.text())
            .catch((err) => `Err\n${err}`);
        }
        const hydrated = parseInteraction(interaction, text, context);
        return [key, hydrated];
      })
    ).then((entries) => {
      setHydratedInteractions(Object.fromEntries(entries.filter(([_]) => Boolean(_))));
    });
  }, [map, walls, originX, originY, width, height, possesses]);

  // Set 'solid' and 'passable' layers based on walls table
  useEffect(() => {
    setSolid(area.map((row) => row.map((cell) => walls[cell] ? cell : '')));
    setPassable(area.map((row) => row.map((cell) => walls[cell] ? '' : cell)));
  }, [area]);

  useEffect(() => {
    const backdrops = map.slice(posY - 2, posY + 1).map((row) => {
      return row.slice(originX, originX + width);
    });

    // From the foreground working backwards, add walls that are not obscured
    // by a more foreground layer already processed.
    const layers = [];
    backdrops.reverse().forEach((row) => {
      const line = Array.from({ length: row.length }, () => ' ');
      row.forEach((cell, index) => {
        if (walls[cell]) {
          const layer = layers.find((line) => walls[line[index]]);
          if (!layer || hydratedInteractions[layer[index]]?.short) {
            line[index] = cell;
          }
        }
      });
      // const upperLine = line.map((cell) => walls[cell]?.short ? '' : cell);
      layers.push(line);
    });
    setForeground(layers[0]);
    setBackground1(layers[1]);
    setBackground2(layers[2]);
  }, [map, hydratedInteractions, originX, posY, width]);

  // Set 'objects' layer from interactions
  useEffect(() => {
    const objects = Array.from({ length: height }, () => ' '.repeat(width).split(''));
    Object.entries(interactions).forEach(([location]) => {
      let [ly, lx] = location.split(',').map(Number);
      ly--; lx--;
      if (lx >= originX && lx < originX + width && ly >= originY && ly < originY + height) {
        objects[ly - originY][lx - originX] = map[ly][lx];
      }
    });
    setObjects(objects);
  }, [map, interactions, originY, originX, width, height]);

  // Package local, position, and origin into objects
  useEffect(() => {
    setOrigin({ x: originX, y: originY });
  }, [originX, originY]);

  useEffect(() => {
    setLocal({ x: localX, y: localY });
    setPosition({ x: posX, y: posY });
  }, [localX, localY, posX, posY]);

  return {
    layers: {
      solid,
      passable,
      objects,
      foreground,
      background1,
      background2,
    },
    size,
    walls,
    marker,
    bump,
    zone,
    interactions: hydratedInteractions,
    position,
    local,
    origin,
  };
}
