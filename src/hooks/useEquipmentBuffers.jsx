import { useState, useEffect } from 'react';

import useEquipment from '../hooks/useEquipment';
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

function farColumns(inventory, equipment, kind1, kind2) {
  function label(kind) {
    const { icon, stats: { A=0, D=0 }={} } = (
      inventory[kind]?.find(({ id }) => id === equipment[kind]) || {}
    );
    return `${ABBREVIATIONS[kind]} ${minifyNumbers(A || D)}`;
  }
  return (
    label(kind1).split('')
    .concat(
      ['', '', '', '', '', '', ''],
      label(kind2).split('')
    )
  );
}

export default function useEquipmentBuffers(enabled, {
  inventory, equipment, equip,

  width, height, keyMap,
}) {
  const [buffers, setBuffers] = useState(null);

  const { buffers: _buffers } = useEquipment({ inventory, ...equipment });

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
          const items = inventory[EQUIPMENT_ORDER[selectedSlot]];
          if (!items) {
            setScrollOffset(0);
            return;
          }
          const currentItem = items.findIndex(
            ({ id }) => id === equipment[EQUIPMENT_ORDER[selectedSlot]]
          );
          setScrollOffset(currentItem + 1);  // +1 because empty '--' is always prepended
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, selectedSlot, inventory, equipment]);

  // Keybind equipment listing selection
  useEffect(() => {
    if (!enabled || slotChoice === null) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setScrollOffset((offset) => {
            if (offset <= 0) return 0;
            return offset - 1;
          });
          break;
        case keyMap.down:
          setScrollOffset((offset) => {
            if (offset >= inventory[slotChoice].length) return offset;
            return offset + 1;
          });
          break;
        case keyMap.select:
          equip(slotChoice, inventory[slotChoice][scrollOffset - 1]?.id || null);
          setSlotChoice(null);
          break;
        case keyMap.cancel:
          setSlotChoice(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, equip, inventory, scrollOffset, equipment]);

  // Primary view
  // Main equipment display, doesn't update unless equipped items change
  useEffect(() => {
    if (!enabled || slotChoice !== null) {
      setEquipmentLayoutBuffer(null);
      return;
    }
    setEquipmentLayoutBuffer([
      '', '', '', '',
      farColumns(inventory, equipment, 'weapon', 'head'),
      farColumns(inventory, equipment, 'body', 'arms'),
      farColumns(inventory, equipment, 'legs', 'shield'),
      farColumns(inventory, equipment, 'feet', 'waist'),
    ]);
  }, [enabled, slotChoice, inventory, equipment]);

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
    const list = [
      { id: null, name: '--' }
    ].concat(inventory[slotChoice]).map(({ id, name }) => {
      let label = `  ${name}`;
      if (id === equipment[slotChoice]) {
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
  }, [enabled, slotChoice, scrollOffset, inventory, equipment, height, width]);

  useEffect(() => {
    if (!enabled) {
      setBuffers(null);
      return;
    }
    if (slotChoice === null) {
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
              (slotChoice === 'weapon' || inventory[slotChoice][scrollOffset - 1]?.stats?.A !== undefined ? (
                `Atk ${minifyNumbers(inventory[slotChoice][scrollOffset - 1]?.stats?.A || 0)}`
              ) : (
                `Def ${minifyNumbers(inventory[slotChoice][scrollOffset - 1]?.stats?.D || 0)}`
              ))
        ]},
        scrollBuffer && { fg: '#c7c7c7', buffer: scrollBuffer },
        scrollSelectionBuffer && { bg: '#aaa', fg: 'black', buffer: scrollSelectionBuffer },
      ].filter(Boolean));
    }
  }, [enabled, _buffers, slotChoice, scrollOffset, scrollBuffer, scrollSelectionBuffer, equipmentLayoutBuffer, selectedSlotBuffer, inventory]);

  return buffers;
}
