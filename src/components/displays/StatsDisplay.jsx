import { useEffect, useState } from 'react';

import ScreenStack from './ScreenStack';
import useStats from '../../hooks/useStats';
import useEquipment from '../../hooks/useEquipment';
import useInventory from '../../hooks/useInventory';
import { keyAlias, minifyNumbers, bufferizeList } from '../../utils';

const TABS = ['Equip', 'Map', 'Log', 'GP']

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
        case keyMap.left: setMenuChoice((choice) => (choice + TABS.length - 1) % TABS.length); break;
        case keyMap.right: setMenuChoice((choice) => (choice + 1) % TABS.length); break;
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
          const currentItem = inventory[EQUIPMENT_ORDER[subMenuChoice]].findIndex(
            ({ id }) => id === equipment[EQUIPMENT_ORDER[subMenuChoice]].id
          );
          setEquipScrollOffset(currentItem);
          break;
        // case keyMap.cancel:
        //   setSubMenuChoice(null);
        //   break;
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
      (line, i) => i === 6 ? line : ''
    ));
  }, [equipChoice, equipScrollOffset, height, width]);

  return (
    <ScreenStack
      width={width}
      height={height}
      magnification={magnification}
      gutter='black'
      hints={[
        `(${keyAlias(keyMap.up)}/`,
        `${keyAlias(keyMap.down)}) to select,`,
        ` (${keyAlias(keyMap.left)}/`,
        `${keyAlias(keyMap.right)}) to change menu,`,
        ` (${keyAlias(keyMap.select)}) to select`,
        ` (${keyAlias(keyMap.cancel)}) to cancel`,
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
          TABS.join(' '),
        ]},
        { bg: '#c7c7c7', fg: 'black', buffer: [
          '', '', '',
          [...Array.from(TABS.slice(0, menuChoice).join(' '), () => ''), ...(menuChoice ? [''] : []), ...TABS[menuChoice].split('')]
        ]},
        ...(
          // Equipment
          TABS[menuChoice] === 'Equip' ? (
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
                  (inventory[equipChoice][equipScrollOffset]?.stats?.A !== undefined ? (
                    `Atk ${minifyNumbers(inventory[equipChoice][equipScrollOffset].stats?.A || 0)}`
                  ) : (
                    `Def ${minifyNumbers(inventory[equipChoice][equipScrollOffset].stats?.D || 0)}`
                  ))
            ]},
            equipmentScrollBuffer && { fg: '#c7c7c7', buffer: equipmentScrollBuffer },
            equipmentScrollBuffer && { bg: '#aaa', fg: 'black', buffer: equipmentScrollSelectionBuffer },
          ])
        ) : TABS[menuChoice] === 'Map' ? (
          // Map
          [{fg: 'red', buffer: ['', '', '', '', "Map"]}]
        ) : TABS[menuChoice] === 'Log' ? (
          // Quests
          [{fg: 'green', buffer: ['', '', '', '', "Quests"]}]
        ) : TABS[menuChoice] === 'GP' ? (
          [{fg: 'gold', buffer: ['', '', '', '', "GP"]}]
        ) : []),
      ].filter(Boolean)}
    />
  );
}
