import { useState, useEffect } from 'react';

const RARITY_COLORS = [
  '#888',
  '#c7c7c7',
  '#8d8',
  '#ff0',
  '#f0f',
];

function useEquipmentFile(inventory, kind, id, position, secondPosition=null) {
  const item = inventory[kind]?.find(item => item.id === id);
  const { template='none', rarity=0, name='--' } = item || {};
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`equipment/${kind}/${template}.txt`)
      .then((res) => res.text())
      .then((text) => {
        const buffer = Array.from({ length: 4 }, () => Array(6).fill(' '));
        const [graphics, stats] = text.trim().split('---');
        const lines = graphics.split('\n');
        let icon = null;
        lines.forEach((line) => {
          let [offset, sprites=''] = line.split(':');
          offset = parseInt(offset, 10);
          if (!secondPosition || !sprites.includes(',')) {
            sprites = sprites.split('');
            sprites.forEach((char, i) => {
              buffer[position[0] + offset][position[1] + i] = char;
            });
          } else if (sprites.includes(',')) {
            sprites = sprites.split(',', 2);
            buffer[position[0] + offset][position[1]] = sprites[0];
            buffer[secondPosition[0] + offset][secondPosition[1]] = sprites[1];
          }
          if (!icon) {
            icon = sprites.join('').trim()[0];
          }
      });
        const data = {
          ...item, kind, rarity, template, name, buffer, icon,
        };
        stats && stats.split('\n').forEach((line) => {
          const [stat, value] = line.split(':');
          data.stats[stat] = parseInt(value, 10);
        });
        return data;
      })
      .then(setData);
  }, [kind, name, template]);

  return data;
}


export default function useEquipment({
  inventory,
  hair=null,
  head=null,
  arms=null,
  body=null,
  waist=null,
  legs=null,
  feet=null,
  weapon=null,
  shield=null,
}) {
  const hairData = useEquipmentFile(inventory, "hair", hair, [0, 2]);
  const headData = useEquipmentFile(inventory, "head", head, [0, 3]);
  const armsData = useEquipmentFile(inventory, "arms", arms, [1, 2], [1, 4]);
  const bodyData = useEquipmentFile(inventory, "body", body, [1, 3]);
  const waistData = useEquipmentFile(inventory, "waist", waist, [2, 2], [2, 4]);
  const legsData = useEquipmentFile(inventory, "legs", legs, [2, 3]);
  const feetData = useEquipmentFile(inventory, "feet", feet, [3, 2], [3, 4]);
  const weaponData = useEquipmentFile(inventory, "weapon", weapon, [1, 0]);
  const shieldData = useEquipmentFile(inventory, "shield", shield, [1, 5]);

  const [buffers, setBuffers] = useState(null);

  // Flatten buffers into a single buffer
  useEffect(() => {
    const buffers = Array.from({ length: RARITY_COLORS.length }, () => ({
      fg: '#fff', buffer: [],
    }));
    RARITY_COLORS.forEach((color, i) => {
      buffers[i].fg = color;
      buffers[i].buffer = Array.from({ length: 4 }, () => Array(6).fill(''));
    });
    function copy(piece) {
      if (!piece) return;
      piece && piece.buffer.forEach((line, y) => {
        line.forEach((char, x) => {
          if (char !== ' ') {
            buffers[piece.rarity].buffer[y][x] = char;
          }
        });
      });
    }
    [hairData, headData, armsData, bodyData, waistData, legsData, feetData,
      weaponData, shieldData].forEach(copy);
    setBuffers(buffers);
  }, [hairData, headData, armsData, bodyData, waistData, legsData, feetData, weaponData, shieldData]);

  return {
    hair: hairData,
    head: headData,
    arms: armsData,
    body: bodyData,
    waist: waistData,
    legs: legsData,
    feet: feetData,
    weapon: weaponData,
    shield: shieldData,
    buffers,
  };
}
