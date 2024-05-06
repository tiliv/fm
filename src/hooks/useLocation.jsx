import { useState, useEffect } from 'react';

import usePosition from './usePosition';
import useWorld from './useWorld';

export default function useLocation({ world, x, y, width, height, possesses, keyMap={} }) {
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

  const localX = posX % width;
  const localY = posY % height;
  const originX = posX - localX;
  const originY = posY - localY;

  useEffect(() => {
    setArea(map.slice(originY, originY + height).map(
      (row) => row.slice(originX, originX + width)
    ));
  }, [map, originX, originY]);

  useEffect(() => {
    setSolid(area.map((row) => row.map((cell) => walls.includes(cell) ? cell : ' ')));
    setPassable(area.map((row) => row.map((cell) => walls.includes(cell) ? ' ' : cell)));
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
    marker,
    bump,
    interactions,
    position: { x: posX, y: posY },
    local: { x: localX, y: localY },
    origin: { x: originX, y: originY },
  };
}
