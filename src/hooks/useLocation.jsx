import usePosition from './usePosition';
import useWorld from './useWorld';

export default function useLocation({ world, x, y, w, h, keyMap={} }) {
  const { map, walls, interactions } = useWorld({ defaultWorld: world });
  const { marker, bump, x: posX, y: posY } = usePosition({
    defaultX: x, defaultY: y,
    map, walls, interactions,
    keyMap,
  });

  const localX = posX % w;
  const localY = posY % h;
  const originX = posX - localX;
  const originY = posY - localY;

  const area = map.slice(originY, originY + h).map(
    (row) => row.slice(originX, originX + w)
  );
  const solid = area.map((row) => row.map((cell) => walls.includes(cell) ? cell : ' '));
  const passable = area.map((row) => row.map((cell) => walls.includes(cell) ? ' ' : cell));
  const objects = Array.from({ length: h }, () => ' '.repeat(w).split(''));
  Object.entries(interactions).forEach(([location]) => {
    let [ly, lx] = location.split(',').map(Number);
    ly--; lx--;
    if (lx >= originX && lx < originX + w && ly >= originY && ly < originY + h) {
      objects[ly - originY][lx - originX] = map[ly][lx];
    }
  });
  objects[localY][localX] = marker;

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
