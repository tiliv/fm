import useSpriteLayers from './useSpriteLayers';
import useDisplayEquipable from './useDisplayEquipable';

const SLOT_ORDER = [
  'ring1a',
  'ring1b',
  'ring2a',
  'ring2b',
  'ring3a',
  'ring3b',
  'ring4a',
  'ring4b',
];
const SLOTS = {
  ring1a: [" ", [0, 0]],
  ring1b: [" ", [0, 2]],
  ring2a: [" ", [1, 0]],
  ring2b: [" ", [1, 2]],
  ring3a: [" ", [2, 0]],
  ring3b: [" ", [2, 2]],
  ring4a: [" ", [3, 0]],
  ring4b: [" ", [3, 2]],
};
const SPRITE_POSITIONS = {
  ring1a: [[0, 0]],
  ring1b: [[0, 2]],
  ring2a: [[1, 0]],
  ring2b: [[1, 2]],
  ring3a: [[2, 0]],
  ring3b: [[2, 2]],
  ring4a: [[3, 0]],
  ring4b: [[3, 2]],
};

export default function useSubDisplayRings(enabled, {
  inventory, equipment, equip,

  width, height, keyMap,
}) {
  const { layers } = useSpriteLayers({
    inventory,
    equipment,
    positions: SPRITE_POSITIONS,
    width,
    height: 4,
    mapKind: (kind) => 'rings',
  });

  const buffers = useDisplayEquipable(enabled, {
    width, height, keyMap,

    inventory, equipment, equip,
    spriteLayers: layers,
    slotOrder: SLOT_ORDER,
    slots: SLOTS,
  });

  return buffers;
}
