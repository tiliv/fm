import { useEffect, useState } from 'react';

import ScreenStack from './ScreenStack';
import useStats from '../../hooks/useStats';
import useEquipment from '../../hooks/useEquipment';

const MINI_NUMBERS = '₀₁₂₃₄₅₆₇₈₉⏨'
const ABBREVIATIONS = {
  weapons: 'Wp',
  shields: 'Sh',
  head: 'Hd',
  body: 'Bd',
  arms: 'Ar',
  waist: 'Ws',
  legs: 'Lg',
  feet: 'Ft',
};

function minifyNumbers(str) {
  return `${str}`.replace(/\d/g, (match) => MINI_NUMBERS[match]);
}

function farColumns(info1, info2) {
  function label(data) {
    const { kind='?', icon, stats: { A=0, D=0 }={} } = data;
    return `${ABBREVIATIONS[kind]} ${minifyNumbers(A || D)}`;
  }
  return (
    label(info1 || {}).split('')
    .concat(
      ['', '', '', '', '', '', ''],
      label(info2 || {}).split('')
    )
  );
}


export default function StatsDisplay({
  width, height, world,
  keyMap={
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    select: ' ',
  },
  magnification=1,
}) {
  const { name, hp, maxHp, mp, strength, defense, speed } = useStats();
  const {
    hair, head, body, arms, waist, legs, feet, weapon, shield,
    buffers,
  } = useEquipment({
    hair: { template: 'ponytail' },
    head: { template: 'helmet', rarity: 2, name: "Iron helmet", stats: {D: 2} },
    body: { template: 'jacket', rarity: 3, name: "Jacket", stats: {D: 3} },
    arms: { template: 'straight', rarity: 0, name: "Arms" },
    waist: { template: 'bag', rarity: 1, name: "Side bag", stats: {D: 0} },
    legs: { template: 'shortskirt', rarity: 2, name: "Crooked skirt", stats: {D: 1} },
    feet: { template: 'dainty', rarity: 0, name: "Paper bags", stats: {D: 2} },
    weapon: { template: 'magicstaff', rarity: 4, name: "Arcane Staff", stats: {D: 1, A: 1} },
    shield: { template: 'board', rarity: 1, name: "Driftwood", stats: {D: 2} },
  });

  const [equippedBuffer, setEquippedBuffer] = useState(null);

  useEffect(() => {
    setEquippedBuffer({ fg: 'white', buffer: [
      '', '', '', '',
      farColumns(weapon, head),
      farColumns(body, arms),
      farColumns(legs, shield),
      farColumns(feet, waist),
    ]});
  }, [weapon, head, body, arms, legs, shield, feet, waist]);

  return (
    <ScreenStack
      width={width}
      height={height}
      defaultBg='black'
      defaultFg='red'
      magnification={magnification}
      gutter='black'
      hints='Stats'
      buffers={[
        { fg: '#c7c7c7', buffer: [
          `➧${name}`,
          ['HP:', `${hp}`.padStart(3, ' '), 'ヽ', `${minifyNumbers(maxHp)}`.padStart(3, ' '),
          ' M:', mp].join(''),
          [
            'A:', `${strength}`.padStart(2, ' '),
            '  D:', `${defense}`.padStart(2, ' '),
            '  S:', `${speed}`.padStart(2, ' '),
          ].join(''),
          'Equip Map Quests',
        ]},
        { bg: '#c7c7c7', fg: 'black', buffer: [
          '', '', '',
          'Equip',
        ]},
        // { fg: '#888', buffer: [
        //   '', '', '', '',
        // ]},
        ...(buffers || []).map(({ fg, buffer }) => ({
          fg: fg, buffer: [].concat(['', '', '', ''], buffer.map(
            (line) => [].concat(['', '', '', ''], line)
          ))
        })),
        equippedBuffer,
      ].filter(Boolean)}
    />
  );
}
