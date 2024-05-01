import { useState, useEffect } from 'react';

import { minifyNumbers, bufferizeList } from '../utils';


export default function useDisplayEquipable(enabled, {
  inventory, equipment, equip,
  slotOrder, slots,
  spriteLayers,

  width, height, keyMap,
}) {
  const [buffers, setBuffers] = useState(null);

  // Main display
  const [layoutBuffer, setLayoutBuffer] = useState(null);

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
          setSelectedSlot((choice) => (choice + slotOrder.length - 1) % slotOrder.length);
          break;
        case keyMap.down:
          setSelectedSlot((choice) => ((choice === null ? -1 : choice) + 1) % slotOrder.length);
          break;
        case keyMap.select:
          setSlotChoice(slotOrder[selectedSlot]);
          const items = inventory[slotOrder[selectedSlot]];
          if (!items) {
            setScrollOffset(0);
            return;
          }
          const currentItem = items.findIndex(
            ({ id }) => id === equipment[slotOrder[selectedSlot]]
          );
          setScrollOffset(currentItem + 1);  // +1 because empty '--' is always prepended
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, selectedSlot, inventory, equipment]);

  // Keybind list picker selection
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
            if (offset >= inventory[slotChoice]?.length || 1) return offset;
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
  // Main display, doesn't update unless equipped items change
  useEffect(() => {
    if (!enabled || slotChoice !== null) {
      setLayoutBuffer(null);
      return;
    }

    const buffer = Array.from({ length: height - 4 }, () => Array(width).fill(''));
    Object.entries(slots).forEach(([kind, [label, [row, col], statType=null]]) => {
      const item = inventory[kind]?.find(({ id }) => id === equipment[kind]) || {};
      const { stats: { [statType?statType[0]:null]: stat=null }={} } = item;
      const statValue = statType === null ? '' : stat === null ? '-' : minifyNumbers(stat);
      const display = `${label}${label ? ' ' : ''}${statValue}`;
      buffer[row].splice(col, display.length, ...display.split(''));
    });

    setLayoutBuffer(['', '', '', '', ...buffer]);
  }, [enabled, slotChoice, inventory, equipment, width, height]);

  // Based on selected slot, create the highlighter buffer
  useEffect(() => {
    if (!enabled || selectedSlot === null) {
      setSelectedSlotBuffer(null);
      return;
    }

    const buffer = Array.from({ length: height - 4 }, () => Array(width).fill(''));
    slotOrder.forEach((kind, i) => {
      if (i !== selectedSlot) return;
      const [label, [row, col], statType=null] = slots[kind];
      const item = inventory[kind]?.find(({ id }) => id === equipment[kind]) || {};
      const { stats: { [statType?statType[0]:null]: stat=null }={} } = item;
      const statValue = statType === null ? '' : stat === null ? '-' : minifyNumbers(stat);
      const display = `${label}${label ? ' ' : ''}${statValue}`;
      buffer[row].splice(col, display.length, ...display.split(''));
    });

    //   buffer.push(...Array.from({ length: selectedSlot % (slotOrder.length / 2) }, () => ''));
    // buffer.push([...Array.from({ length: selectedSlot >= (slotOrder.length / 2) ? 11 : 0 }, () => ''),
    //   ...abbreviations[slotOrder[selectedSlot]].split('')
    // ]);
    setSelectedSlotBuffer(['', '', '', '', ...buffer]);
  }, [enabled, layoutBuffer, selectedSlot]);

  // Secondary view
  // Create equipment scroll buffer
  useEffect(() => {
    if (!enabled || !slotChoice) return;
    const list = [
      { id: null, name: '--' }
    ].concat(inventory[slotChoice] || []).map(({ id, name }) => {
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

  // Store active view
  useEffect(() => {
    if (!enabled) {
      setBuffers(null);
      return;
    }
    if (slotChoice === null) {
      setBuffers([
        layoutBuffer && { fg: '#555', buffer: layoutBuffer },
        selectedSlotBuffer && { bg: '#888', fg: 'black', buffer: selectedSlotBuffer },
        ...(
          [].concat((spriteLayers || []).map(({ fg, buffer }) => ({
            fg: fg, buffer: [].concat(['', '', '', ''], buffer)
          })),
        ))
      ].filter(Boolean));
    } else {
      setBuffers([
        { bg: '#888', fg: 'black', buffer: [
          '', '', '', '',
          `${slotChoice[0].toUpperCase() + slotChoice.slice(1)}:`.padEnd(width - 5, ' ')
            + (slots[slotChoice][2]
                ? `${slots[slotChoice][2]} ${minifyNumbers(inventory[slotChoice][scrollOffset - 1]?.stats?.[slots[slotChoice][2][0]] || 0)}`
                : '')
        ]},
        scrollBuffer && { fg: '#c7c7c7', buffer: scrollBuffer },
        scrollSelectionBuffer && { bg: '#aaa', fg: 'black', buffer: scrollSelectionBuffer },
      ].filter(Boolean));
    }
  }, [
    enabled, spriteLayers, slotChoice, scrollOffset, scrollBuffer,
    scrollSelectionBuffer, layoutBuffer, selectedSlotBuffer, inventory,
  ]);

  return buffers;
}
