import { useState, useEffect } from 'react';

import usePosition from './usePosition';
import useWorld from './useWorld';
import { parseInteraction } from '../interactions';

export default function useLocation({ world, x, y, width, height, name, possesses, keyMap={} }) {
  const { map, walls, interactions } = useWorld({ world });
  const { marker, bump, x: posX, y: posY } = usePosition({
    defaultX: x, defaultY: y,
    map, walls, interactions, possesses,
    keyMap,
  });

  const [area, setArea] = useState([]);
  const [solid, setSolid] = useState([]);
  const [passable, setPassable] = useState([]);
  const [objects, setObjects] = useState([]);
  const [hydratedInteractions, setHydratedInteractions] = useState({});

  const localX = posX % width;
  const localY = posY % height;
  const originX = posX - localX;
  const originY = posY - localY;

  useEffect(() => {
    setArea(map.slice(originY, originY + height).map(
      (row) => row.slice(originX, originX + width)
    ));

    // Hydrate interactions on this viewport
    Promise.all(
      Object.entries(interactions).map(async ([location, interaction]) => {
        const [y, x] = location.split(',').map(Number);
        if ((x < originX || x >= originX + width) || (y < originY || y >= originY + height)) {
          return [null, null];
        }
        const attributes = interaction.attributes || {};
        const context = { ...attributes, name, possesses };
        const { label, dataFile } = interaction;
        let text = '';
        if (label && dataFile) {
          text = await fetch(`interactions/${label}/${dataFile}`)
            .then((res) => res.text())
            .catch((err) => `Err\n${err}`);
        }
        const hydrated = parseInteraction(interaction, text, context);
        return [location, hydrated];
      })
    ).then((entries) => {
      setHydratedInteractions(Object.fromEntries(entries.filter(([_]) => Boolean(_))));
    });
  }, [map, originX, originY, width, height, possesses]);

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

  return {
    layers: {
      solid,
      passable,
      objects,
    },
    walls,
    marker,
    bump,
    interactions: hydratedInteractions,
    position: { x: posX, y: posY },
    local: { x: localX, y: localY },
    origin: { x: originX, y: originY },
  };
}
