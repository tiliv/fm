import { useState, useEffect, useRef } from 'react';

const RARITY_COLORS = [
  '#888',
  '#c7c7c7',
  '#8d8',
  '#ff0',
  '#f0f',
];

const MAP_KIND_SAME = (kind) => kind;

export default function useSpriteLayers({
  inventory, equipment, positions,
  mapKind=MAP_KIND_SAME,
  offsetLeft=0,
  width, height,  // local width/height, not screen size
}) {
  const inventoryRef = useRef(inventory);
  const [sprites, setSprites] = useState({});
  const [layers, setLayers] = useState(null);

  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  useEffect(() => {
    const promises = Object.keys(positions).map((kind) => {
      const id = equipment[kind];
      const item = inventoryRef.current[mapKind(kind)]?.find((item) => item.id === id) || {};
      const loadKind = mapKind(kind);
      return loadSprite(
        loadKind,
        { ...item, kind },
        { offsetLeft, width, height },
        ...positions[kind]
      );
    });
    Promise.all(promises).then((sprites) => {
      const spritesByKind = Object.fromEntries(sprites.map((sprite) => {
        return [sprite.kind, sprite];
      }));
      setSprites(spritesByKind);
    });
  }, [equipment, positions, offsetLeft, width, height, mapKind]);

  // Flatten buffers into a single buffer per rarity
  useEffect(() => {
    const buffers = Array.from({ length: RARITY_COLORS.length }, () => ({
      fg: '#fff', buffer: [],
    }));
    RARITY_COLORS.forEach((color, i) => {
      buffers[i].fg = color;
      buffers[i].buffer = Array.from({ length: height }, () => Array(width).fill(''));
    });
    Object.values(sprites).forEach(function(sprite) {
      if (!sprite) return;
      sprite && sprite.buffer.forEach((line, y) => {
        line.forEach((char, x) => {
          if (char !== ' ') {
            buffers[sprite.rarity].buffer[y][x] = char;
          }
        });
      });
    });
    setLayers(buffers);
  }, [sprites]);

  return {
    sprites,
    layers,
  };
}

async function loadSprite(kind, item, { offsetLeft=0, width, height }, ...positions) {
  const { template='none', rarity=0, name='--' } = item;
  const [[row, col], secondPosition=null] = positions;
  return await fetch(`equipment/${kind}/${template}.txt?${item.kind}`)
    .then((res) => res.text())
    .then((text) => {
      const buffer = Array.from({ length: height }, () => Array(offsetLeft + width).fill(' '));
      const [graphics, stats] = text.trim().split('---');
      const lines = graphics.split('\n');
      let icon = null;
      lines.forEach((line) => {
        let [offset, sprites=''] = line.split(':');
        offset = parseInt(offset, 10);
        if (!secondPosition || !sprites.includes(',')) {
          sprites = sprites.split('');
          sprites.forEach((char, i) => {
            buffer[row + offset][col + i + offsetLeft] = char;
          });
        } else if (sprites.includes(',')) {
          sprites = sprites.split(',', 2);
          buffer[row + offset][col + offsetLeft] = sprites[0];
          buffer[secondPosition[0] + offset][secondPosition[1] + offsetLeft] = sprites[1];
        }
        if (!icon) {
          icon = sprites.join('').trim()[0];
        }
    });
      const data = {
        ...item, template, rarity, name, buffer, icon,
      };
      stats && stats.split('\n').forEach((line) => {
        const [stat, value] = line.split(':');
        data.stats[stat] = parseInt(value, 10);
      });
      return data;
    });
}
