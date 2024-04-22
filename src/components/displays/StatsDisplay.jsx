import { useEffect, useState } from 'react';

import ScreenStack from './ScreenStack';
import useStats from '../../hooks/useStats';
import useEquipment from '../../hooks/useEquipment';
import { KEY_ALIASES } from '../../constants';

const MINI_NUMBERS = '₀₁₂₃₄₅₆₇₈₉⏨'
const ABBREVIATIONS = {
  weapon: 'Wp',
  shield: 'Sh',
  head: 'Hd',
  body: 'Bd',
  arms: 'Ar',
  waist: 'Ws',
  legs: 'Lg',
  feet: 'Ft',
};
const EQUIPMENT_ORDER = [
  'weapon', 'body', 'legs', 'feet',
  'head', 'arms', 'shield', 'waist',
];

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
    cancel: 'Escape',
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

  const [menuChoice, setMenuChoice] = useState(0);
  const [subMenuChoice, setSubMenuChoice] = useState(null);
  const [subMenuChoiceBuffer, setSubMenuChoiceBuffer] = useState([]);
  const [equipChoice, setEquipChoice] = useState(null);

  // Change horizontal menu category
  useEffect(() => {
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.left: setMenuChoice((choice) => (choice + 2) % 3); break;
        case keyMap.right: setMenuChoice((choice) => (choice + 1) % 3); break;
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  // Change vertical menu choice during Equip (unbinds when not on main Equip view)
  useEffect(() => {
    if (menuChoice !== 0 || equipChoice) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setSubMenuChoice((choice) => (choice + EQUIPMENT_ORDER.length - 1) % EQUIPMENT_ORDER.length);
          break;
        case keyMap.down:
          setSubMenuChoice((choice) => ((choice === null ? -1 : choice) + 1) % EQUIPMENT_ORDER.length);
          break;
        case keyMap.select:
          setEquipChoice(EQUIPMENT_ORDER[subMenuChoice]);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [menuChoice, subMenuChoice, equipChoice]);

  // Handle equip slot selection view
  useEffect(() => {
    if (!equipChoice) return;

    const keydown = (e) => {
      switch (e.key) {
        case keyMap.cancel:
          setEquipChoice(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [equipChoice]);

  // Create equip menu subMenuChoice's highlight buffer
  useEffect(() => {
    if (subMenuChoice === null) return;
    const buffer = [];
    buffer.push('', '', '', '');
    buffer.push(...Array.from({ length: subMenuChoice % (EQUIPMENT_ORDER.length / 2) }, () => ''));
    buffer.push([...Array.from({ length: subMenuChoice >= (EQUIPMENT_ORDER.length / 2) ? 11 : 0 }, () => ''),
      ...ABBREVIATIONS[EQUIPMENT_ORDER[subMenuChoice]].split('')
    ]);
    setSubMenuChoiceBuffer(buffer);
  }, [subMenuChoice]);

  // Create equip menu display buffer
  useEffect(() => {
    setEquippedBuffer({ fg: '#555', buffer: [
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
      magnification={magnification}
      gutter='black'
      hints={[
        `(${KEY_ALIASES[keyMap.up] || keyMap.up}/`,
        `${KEY_ALIASES[keyMap.down] || keyMap.down}) to select,`,
        ` (${KEY_ALIASES[keyMap.left] || keyMap.left}/`,
        `${KEY_ALIASES[keyMap.right] || keyMap.right}) to change menu,`,
        ` (${KEY_ALIASES[keyMap.select] || keyMap.select}) to select`,
        ` (${KEY_ALIASES[keyMap.cancel] || keyMap.cancel}) to cancel`,
      ].join('')}
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
          [
            'Equip',
            ['', '', '', '', '', '', ...'Map'.split('')],
            ['', '', '', '', '', '', '', '', '', '', ...'Quests'.split('')],
          ][menuChoice],
        ]},
        ...(
          // Equipment
          menuChoice === 0 ? (
            equipChoice === null ? (
            [].concat((buffers || []).map(({ fg, buffer }) => ({
              fg: fg, buffer: [].concat(['', '', '', ''], buffer.map(
                (line) => [].concat(['', '', '', ''], line)
              ))
            })),
            equippedBuffer,
            { bg: '#888', fg: 'black', buffer: subMenuChoiceBuffer },
          )) : (
            [{ fg: 'red', buffer: [
              '', '', '', '',
              equipChoice,

            ] }]
          )
        ) : menuChoice === 1 ? (
          // Map
          [{fg: 'red', buffer: ['', '', '', '', "Map"]}]
        ) : (
          // Quests
          [{fg: 'green', buffer: ['', '', '', '', "Quests"]}]
        )),
      ].filter(Boolean)}
    />
  );
}
