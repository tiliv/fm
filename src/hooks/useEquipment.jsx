import { useState, useEffect } from 'react';

const RARITY_COLORS = [
  '#888',
  '#c7c7c7',
  '#8d8',
  '#ff0',
  '#f0f',
];

function useEquipmentFile(kind, spec, position, secondPosition=null) {
  const { template='none', rarity=0, name='--' } = spec || {};
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/equipment/${kind}/${template}.txt`)
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
          ...spec, kind, rarity, template, name, buffer, icon,
        };
        stats && stats.split('\n').forEach((line) => {
          const [stat, value] = line.split(':');
          data.stats[stat] = parseInt(value, 10);
        });
        return data;
      })
      .then(setData);
  }, [kind, name]);

  return data;
}


export default function useEquipment({
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
  const hairData = useEquipmentFile("hair", hair, [0, 2]);
  const headData = useEquipmentFile("head", head, [0, 3]);
  const armsData = useEquipmentFile("arms", arms, [1, 2], [1, 4]);
  const bodyData = useEquipmentFile("body", body, [1, 3]);
  const waistData = useEquipmentFile("waist", waist, [2, 2], [2, 4]);
  const legsData = useEquipmentFile("legs", legs, [2, 3]);
  const feetData = useEquipmentFile("feet", feet, [3, 2], [3, 4]);
  const weaponData = useEquipmentFile("weapon", weapon, [1, 0]);
  const shieldData = useEquipmentFile("shield", shield, [1, 5]);

  const [buffers, setBuffers] = useState(null);

  // Flatten buffers into a single buffer
  useEffect(() => {
    const buffers = Array.from({ length: RARITY_COLORS.length }, () => ({ fg: '#fff', buffer: [] }));
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
      piece.template
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
