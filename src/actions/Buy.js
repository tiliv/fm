import { groupEquipment } from '../utils';

export function parse(target, action) {
  return {
    items: ({ inventory }) => makeItems(target, action, { inventory }),
    text: null,
  };
}

function makeItems(target, { text }, { inventory }) {
  const equipmentGroups = groupEquipment(
    text,
    inventory,
    { target, event: 'Buy.player', consume: true }
  );

  // Turn sub-menu into callable based on built list
  equipmentGroups.forEach((option) => {
    const originals = option.items;
    option.items = ({ inventory }) => originals.filter(({ name }) => {
      return !inventory[option.kind]?.find((item) => item.name === name)
    });
  });
  return equipmentGroups;
};
