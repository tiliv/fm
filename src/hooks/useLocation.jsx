import { useState, useEffect } from 'react';

import usePosition from './usePosition';
import useWorld from './useWorld';
import { parseInteraction, TYPES } from '../interactions';

export default function useLocation({ world, x, y, width, height, possesses, keyMap={} }) {
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
  const [hydratedInteractions, setHydratedInteractions] = useState({});

  const [position, setPosition] = useState({ x: posX, y: posY });
  const [local, setLocal] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const localX = posX % width;
  const localY = posY % height;
  const originX = posX - localX;
  const originY = posY - localY;

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

  useEffect(() => {
    setSolid(area.map((row) => row.map((cell) => walls[cell] ? cell : ' ')));
    setPassable(area.map((row) => row.map((cell) => walls[cell] ? ' ' : cell)));
  }, [area, interactions, height, width]);

  useEffect(() => {
    const objects = Array.from({ length: height }, () => ' '.repeat(width).split(''));
    Object.entries(interactions).forEach(([location]) => {
      let [ly, lx] = location.split(',').map(Number);
      ly--; lx--;
      if (lx >= originX && lx < originX + width && ly >= originY && ly < originY + height) {
        objects[ly - originY][lx - originX] = map[ly][lx];
      }
    });
    objects[localY][localX] = marker;
    setObjects(objects);
  }, [map, interactions, posX, posY, marker, width, height]);

  useEffect(() => {
    setLocal({ x: localX, y: localY });
  }, [localX, localY]);

  useEffect(() => {
    setPosition({ x: posX, y: posY });
  }, [posX, posY]);

  useEffect(() => {
    setOrigin({ x: originX, y: originY });
  }, [originX, originY]);

  return {
    layers: {
      solid,
      passable,
      objects,
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
