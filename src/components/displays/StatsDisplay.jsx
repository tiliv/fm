import { useEffect, useState } from 'react';

import ScreenStack from './ScreenStack';
import useStats from '../../hooks/useStats';
import useEquipment from '../../hooks/useEquipment';
import useInventory from '../../hooks/useInventory';
import { KEY_ALIASES } from '../../constants';
import { bufferizeList } from '../../utils';

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
  const { inventory, equipment, setEquipment } = useInventory();
  const { name, hp, maxHp, mp, strength, defense, speed } = useStats();
  const { buffers, ...slots } = useEquipment(equipment);
  const [equippedBuffer, setEquippedBuffer] = useState(null);

  const [menuChoice, setMenuChoice] = useState(0);
  const [subMenuChoice, setSubMenuChoice] = useState(null);
  const [subMenuChoiceBuffer, setSubMenuChoiceBuffer] = useState([]);
  const [equipChoice, setEquipChoice] = useState(null);
  const [equipmentScrollBuffer, setEquipmentScrollBuffer] = useState(null);
  const [equipmentScrollSelectionBuffer, setEquipmentScrollSelectionBuffer] = useState(null);
  const [equipScrollOffset, setEquipScrollOffset] = useState(0);

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
          const currentItem = inventory[EQUIPMENT_ORDER[subMenuChoice]].findIndex(({ id }) => id === equipment[EQUIPMENT_ORDER[subMenuChoice]].id);
          setEquipScrollOffset(currentItem);
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
      farColumns(slots.weapon, slots.head),
      farColumns(slots.body, slots.arms),
      farColumns(slots.legs, slots.shield),
      farColumns(slots.feet, slots.waist),
    ]});
  }, [slots.weapon, slots.head, slots.body, slots.arms, slots.legs,
      slots.shield, slots.feet, slots.waist]);

  // Handle equip slot view scrolling
  useEffect(() => {
    if (!equipChoice) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setEquipScrollOffset((offset) => {
            if (offset === 0) return 0;
            return offset - 1;
          });
          break;
        case keyMap.down:
          setEquipScrollOffset((offset) => {
            if (offset >= inventory[equipChoice].length - 3 + 2) return offset;
            return offset + 1;
          });
          break;
        case keyMap.select:
          // Equip item
          setEquipment(equipChoice, inventory[equipChoice][equipScrollOffset].id);
          setEquipChoice(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [equipChoice, setEquipment]);

  // Create equipment scroll buffer
  useEffect(() => {
    if (!equipChoice) return;
    const list = inventory[equipChoice].map(({ id, name }) => {
      let label = `  ${name}`;
      if (id === equipment[equipChoice].id) {
        label = `*${label.slice(1)}`;
      }
      label = label.padEnd(width, ' ');
      return label;
    });
    const buffer = bufferizeList(5, [''].concat(list, ['']), width, height, equipScrollOffset);
    setEquipmentScrollBuffer(buffer);
    setEquipmentScrollSelectionBuffer(buffer.map(
      (line, i) => i === height - 2 ? line : ''
    ));
  }, [equipChoice, equipScrollOffset]);

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
          )) : ([
            { bg: '#888', fg: 'black', buffer: [
              '', '', '', '',
              `${equipChoice[0].toUpperCase() + equipChoice.slice(1)}:`.padEnd(width - 5, ' ')
                +
                  (inventory[equipChoice][equipScrollOffset]?.stats.A ? (
                    `Atk ${MINI_NUMBERS[inventory[equipChoice][equipScrollOffset].stats.A]}`
                  ) : (
                    `Def ${MINI_NUMBERS[inventory[equipChoice][equipScrollOffset].stats.D]}`
                  ))
            ]},
            equipmentScrollBuffer && { fg: '#c7c7c7', buffer: equipmentScrollBuffer },
            equipmentScrollBuffer && { bg: '#aaa', fg: 'black', buffer: equipmentScrollSelectionBuffer },
          ])
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
