import { useState, useEffect } from 'react';

import useEquipment from '../hooks/useEquipment';
import useInventory from '../hooks/useInventory';
import { minifyNumbers, bufferizeList } from '../utils';

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

export default function useEquipmentBuffers(enabled, { width, height, keyMap }) {
  const [buffers, setBuffers] = useState(null);

  const { inventory, equipment, setEquipment } = useInventory();
  const { buffers: _buffers, ...slots } = useEquipment(equipment);

  // Main display
  const [equipmentLayoutBuffer, setEquipmentLayoutBuffer] = useState(null);

  // Navigating slots
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotBuffer, setSelectedSlotBuffer] = useState(null);

  // Picking from equipment list for a given slot
  const [slotChoice, setSlotChoice] = useState(null);
  const [scrollBuffer, setScrollBuffer] = useState(null);
  const [scrollSelectionBuffer, setScrollSelectionBuffer] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Keybind slot selection
  useEffect(() => {
    if (!enabled || slotChoice !== null) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setSelectedSlot((choice) => (choice + EQUIPMENT_ORDER.length - 1) % EQUIPMENT_ORDER.length);
          break;
        case keyMap.down:
          setSelectedSlot((choice) => ((choice === null ? -1 : choice) + 1) % EQUIPMENT_ORDER.length);
          break;
        case keyMap.select:
          setSlotChoice(EQUIPMENT_ORDER[selectedSlot]);
          const currentItem = inventory[EQUIPMENT_ORDER[selectedSlot]].findIndex(
            ({ id }) => id === equipment[EQUIPMENT_ORDER[selectedSlot]].id
          );
          setScrollOffset(currentItem);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, selectedSlot]);

  // Keybind equipment listing selection
  useEffect(() => {
    if (!enabled || slotChoice === null) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setScrollOffset((offset) => {
            if (offset === 0) return 0;
            return offset - 1;
          });
          break;
        case keyMap.down:
          setScrollOffset((offset) => {
            if (offset >= inventory[slotChoice].length - 3 + 2) return offset;
            return offset + 1;
          });
          break;
        case keyMap.select:
          setEquipment(slotChoice, inventory[slotChoice][scrollOffset].id);
          setSlotChoice(null);
          break;
        case keyMap.cancel:
          setSlotChoice(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, setEquipment]);

  // Primary view
  // Main equipment display, doesn't update unless equipped items change
  useEffect(() => {
    if (!enabled || slotChoice !== null) {
      setEquipmentLayoutBuffer(null);
      return;
    }
    setEquipmentLayoutBuffer([
      '', '', '', '',
      farColumns(slots.weapon, slots.head),
      farColumns(slots.body, slots.arms),
      farColumns(slots.legs, slots.shield),
      farColumns(slots.feet, slots.waist),
    ]);
  }, [enabled, slotChoice, slots.weapon, slots.head, slots.body, slots.arms, slots.legs, slots.shield, slots.feet, slots.waist]);

  // Based on selected slot, create the highlighter buffer
  useEffect(() => {
    if (!enabled || selectedSlot === null) {
      setSelectedSlotBuffer(null);
      return;
    }
    const buffer = [];
    buffer.push('', '', '', '');
    buffer.push(...Array.from({ length: selectedSlot % (EQUIPMENT_ORDER.length / 2) }, () => ''));
    buffer.push([...Array.from({ length: selectedSlot >= (EQUIPMENT_ORDER.length / 2) ? 11 : 0 }, () => ''),
      ...ABBREVIATIONS[EQUIPMENT_ORDER[selectedSlot]].split('')
    ]);
    setSelectedSlotBuffer(buffer);
  }, [enabled, selectedSlot]);

  // Secondary view
  // Create equipment scroll buffer
  useEffect(() => {
    if (!enabled || !slotChoice) return;
    const list = inventory[slotChoice].map(({ id, name }) => {
      let label = `  ${name}`;
      if (id === equipment[slotChoice].id) {
        label = `*${label.slice(1)}`;
      }
      label = label.padEnd(width, ' ');
      return label;
    });
    const buffer = bufferizeList(5, [''].concat(list, ['']), width, height, scrollOffset);
    setScrollBuffer(buffer);
    setScrollSelectionBuffer(buffer.map(
      (line, i) => i === 6 ? line : ''
    ));
  }, [enabled, slotChoice, scrollOffset, inventory, height, width]);

  useEffect(() => {
    if (!enabled) {
      setBuffers(null);
      return;
    }
    if (!slotChoice) {
      setBuffers([
        equipmentLayoutBuffer && { fg: '#555', buffer: equipmentLayoutBuffer },
        selectedSlotBuffer && { bg: '#888', fg: 'black', buffer: selectedSlotBuffer },
        ...(
          [].concat((_buffers || []).map(({ fg, buffer }) => ({
            fg: fg, buffer: [].concat(['', '', '', ''], buffer.map(
              (line) => [].concat(['', '', '', ''], line)
            ))
          })),
        ))
      ].filter(Boolean));
    } else {
      setBuffers([
        { bg: '#888', fg: 'black', buffer: [
          '', '', '', '',
          `${slotChoice[0].toUpperCase() + slotChoice.slice(1)}:`.padEnd(width - 5, ' ')
            +
              (inventory[slotChoice][scrollOffset]?.stats?.A !== undefined ? (
                `Atk ${minifyNumbers(inventory[slotChoice][scrollOffset].stats?.A || 0)}`
              ) : (
                `Def ${minifyNumbers(inventory[slotChoice][scrollOffset].stats?.D || 0)}`
              ))
        ]},
        scrollBuffer && { fg: '#c7c7c7', buffer: scrollBuffer },
        scrollSelectionBuffer && { bg: '#aaa', fg: 'black', buffer: scrollSelectionBuffer },
      ].filter(Boolean));
    }
  }, [enabled, slotChoice, scrollOffset, scrollBuffer, scrollSelectionBuffer, equipmentLayoutBuffer, selectedSlotBuffer, inventory]);

  return buffers;
}
