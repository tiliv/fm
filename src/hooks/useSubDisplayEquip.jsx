import { useMemo } from 'react';

import useSpriteLayers from './useSpriteLayers';
import useDisplayEquipable from './useDisplayEquipable';

const SLOT_ORDER = [
  'weapon', 'body', 'legs', 'feet',
  'head', 'arms', 'shield', 'waist',
];
const SPRITE_POSITIONS = {
  hair: [[0, 2]],
  head: [[0, 3]],
  arms: [[1, 2], [1, 4]],
  body: [[1, 3]],
  waist: [[2, 2], [2, 4]],
  legs: [[2, 3]],
  feet: [[3, 2], [3, 4]],
  weapon: [[1, 0]],
  shield: [[1, 5]],
};

export default function useSubDisplayEquip(enabled, {
  inventory, equipment, equip,

  width, height, keyMap,
}) {
  const slots = useMemo(() => ({
    weapon: ["Wp", [0, 0], 'A'],
    body: ["Bd", [1, 0], 'D'],
    legs: ["Lg", [2, 0], 'D'],
    feet: ["Ft", [3, 0], 'D'],
    head: ["Hd", [0, width - 4], 'D'],
    arms: ["Ar", [1, width - 4], 'D'],
    shield: ["Sh", [2, width - 4], 'D'],
    waist: ["Ws", [3, width - 4], 'D'],
  }), [width]);

  const { layers } = useSpriteLayers({
    inventory,
    equipment,
    positions: SPRITE_POSITIONS,
    width: 6,
    height: 4,
  });

  const buffers = useDisplayEquipable(enabled, {
    width, height, keyMap,

    inventory, equipment, equip,
    spriteLayers: layers,
    slotOrder: SLOT_ORDER,
    slots,
  });

  return buffers;
}
