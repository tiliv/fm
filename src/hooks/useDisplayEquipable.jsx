import { useState, useEffect } from 'react';

import { minifyNumbers, bufferizeList, STAT_NAMES } from '../utils';

const MAP_KIND_SAME = (kind) => kind;

export default function useDisplayEquipable(enabled, {
  inventory, equipment, equip,
  slotOrder, slots,
  sprites, spriteLayers,

  width, height, keyMap,
  mapKind=MAP_KIND_SAME,
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
          if (selectedSlot === null) return;
          setSlotChoice(slotOrder[selectedSlot]);
          const items = inventory[mapKind(slotOrder[selectedSlot])];
          if (!items) {
            setScrollOffset(0);
            return;
          }
          const currentItem = items.findIndex(
            ({ id }) => id === equipment[slotOrder[selectedSlot]]
          );
          setScrollOffset(currentItem + 1);  // +1 because empty '--' is always prepended
          break;
        case keyMap.cancel:
          setSelectedSlot(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, mapKind, selectedSlot, inventory, equipment]);

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
            if (offset >= (inventory[mapKind(slotChoice)] || []).length) {
              return offset;
            }
            return offset + 1;
          });
          break;
        case keyMap.select:
          equip(slotChoice, inventory[mapKind(slotChoice)]?.[scrollOffset - 1]?.id || null);
          setSlotChoice(null);
          break;
        case keyMap.cancel:
          setSlotChoice(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, slotChoice, mapKind, equip, inventory, scrollOffset, equipment]);

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
      const display = `${label}${statValue}`;
      buffer[row].splice(col, display.length, ...display.split(''));
    });

    setLayoutBuffer(['', '', '', '', ...buffer]);
  }, [enabled, slotChoice, inventory, equipment, width, height]);

  // Based on selected slot, create the highlighter buffer
  useEffect(() => {
    if (!enabled || selectedSlot === null || layoutBuffer === null) {
      setSelectedSlotBuffer(null);
      return;
    }

    const buffer = Array.from({ length: height - 4 }, () => Array(width).fill(''));
    slotOrder.forEach((kind, i) => {
      if (i !== selectedSlot) return;
      const [label, [row, col], statType=null] = slots[kind];

      // Copy the layoutBuffer at the same [row, col].  This one will be displayed
      // above it, appearing to invert the colors.
      const w = label.length + (statType ? 1 : 0);
      buffer[row].splice(col, w, ...layoutBuffer[4 + row].slice(col, col + w));
      sprites[kind]?.buffer.forEach((line, y) => {
        line.forEach((char, x) => {
          if (char !== ' ') {
            buffer[y][x] = char;
          }
        });
      });
    });

    setSelectedSlotBuffer(['', '', '', '', ...buffer]);
  }, [enabled, sprites, layoutBuffer, selectedSlot]);

  // Secondary view
  // Create equipment scroll buffer
  useEffect(() => {
    if (!enabled || !slotChoice) return;
    const list = [
      { id: null, name: '--' }
    ].concat(inventory[mapKind(slotChoice)] || []).map(({ id, name }) => {
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
  }, [enabled, slotChoice, mapKind, scrollOffset, inventory, equipment, height, width]);

  // Store active view
  useEffect(() => {
    if (!enabled) {
      setBuffers(null);
      return;
    }
    if (slotChoice === null) {
      setBuffers([
        layoutBuffer && { fg: '#555', buffer: layoutBuffer },
        selectedSlotBuffer && { bg: '#555', fg: 'black', buffer: selectedSlotBuffer },
        ...(
          [].concat((spriteLayers || []).map(({ fg, buffer }) => ({
            fg: fg, buffer: [].concat(['', '', '', ''], buffer)
          })),
        ))
      ].filter(Boolean));
    } else {
      const name = slotChoice[0].toUpperCase() + slotChoice.slice(1);
      const kindList = inventory[mapKind(slotChoice)];
      const stats = kindList[scrollOffset - 1]?.stats || {};
      const statType = STAT_NAMES[slots[slotChoice][2] || Object.keys(stats)[0]];
      const statAbbr = statType ? statType[0] : null;
      const itemInfo = statType
        ? `${statType} ${minifyNumbers(stats[statAbbr] || 0)}`
        : '     '
        ;
      setBuffers([
        { bg: '#888', fg: 'black', buffer: [
          '', '', '', '',
          `${name}:`.padEnd(width - 5, ' ') + itemInfo,
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
