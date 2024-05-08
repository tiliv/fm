import useSpriteLayers from './useSpriteLayers';
import useDisplayEquipable from './useDisplayEquipable';

const SLOT_ORDER = [
  'ring1a',
  'ring2a',
  'ring3a',
  'ring4a',
  'ring1b',
  'ring2b',
  'ring3b',
  'ring4b',
];
const SLOTS = {
  ring1a: ["", [0, 0]],
  ring2a: ["", [1, 0]],
  ring3a: ["", [2, 0]],
  ring4a: ["", [3, 0]],
  ring1b: ["", [0, 2]],
  ring2b: ["", [1, 2]],
  ring3b: ["", [2, 2]],
  ring4b: ["", [3, 2]],
};
const SPRITE_POSITIONS = Object.fromEntries(
  Object.entries(SLOTS).map(([kind, [,position]]) => [kind, [position]])
);
const MAP_KIND = () => 'ring';

export default function useSubDisplayRings(enabled, {
  inventory, equipment, equip,

  width, height, keyMap,
}) {
  const { sprites, layers } = useSpriteLayers({
    inventory,
    equipment,
    positions: SPRITE_POSITIONS,
    width,
    height: 4,
    mapKind: MAP_KIND,
  });

  const buffers = useDisplayEquipable(enabled, {
    width, height, keyMap,

    inventory, equipment, equip,
    sprites,
    spriteLayers: layers,
    slotOrder: SLOT_ORDER,
    slots: SLOTS,
    mapKind: MAP_KIND,
  });

  return buffers;
}
