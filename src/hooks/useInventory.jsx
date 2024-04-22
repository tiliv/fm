import { useState } from 'react';

const INVENTORY = {
  weapon: [
    { id: 1, template: 'ax', rarity: 0, name: 'ax', stats: {A: 7} },
    { id: 2, template: 'bar', rarity: 0, name: 'bar', stats: {A: 3} },
    { id: 3, template: 'claw', rarity: 0, name: 'claw', stats: {A: 4} },
    { id: 4, template: 'flail', rarity: 0, name: 'flail', stats: {A: 6} },
    { id: 5, template: 'mace', rarity: 0, name: 'mace', stats: {A: 2} },
    { id: 6, template: 'magicstaff', rarity: 4, name: "Arcane Staff", stats: {D: 1, A: 2} },
    { id: 7, template: 'quarterstaff', rarity: 0, name: 'quarterstaff', stats: {A: 2} },
    { id: 8, template: 'spear', rarity: 0, name: 'spear', stats: {A: 5} },
    { id: 9, template: 'sword', rarity: 0, name: 'sword', stats: {A: 4} },
    { id: 10, template: 'trident', rarity: 0, name: 'trident', stats: {A: 6} },
    { id: 11, template: 'whip', rarity: 0, name: 'whip', stats: {A: 3} },
  ],
};
const EQUIPMENT = {
  hair: { template: 'ponytail' },
  head: { template: 'helmet', rarity: 2, name: "Iron helmet", stats: {D: 2} },
  body: { template: 'jacket', rarity: 3, name: "Jacket", stats: {D: 3} },
  arms: { template: 'straight', rarity: 0, name: "Arms" },
  waist: { template: 'bag', rarity: 1, name: "Side bag", stats: {D: 0} },
  legs: { template: 'shortskirt', rarity: 2, name: "Crooked skirt", stats: {D: 1} },
  feet: { template: 'dainty', rarity: 0, name: "Paper bags", stats: {D: 2} },
  weapon: { id: 6, template: 'magicstaff', rarity: 4, name: "Arcane Staff", stats: {D: 1, A: 1} },
  shield: { template: 'board', rarity: 1, name: "Driftwood", stats: {D: 2} },
}

export default function useInventory() {
  const [inventory, _setInventory] = useState(INVENTORY);
  const [equipment, _setEquipment] = useState(EQUIPMENT);

  function setEquipment(kind, id) {
    const item = inventory[kind].find((item) => item.id === id);
    if (!item) {
      return;
    }
    _setEquipment((equipment) => ({
      ...equipment,
      [kind]: item,
    }));
  }

  return {
    inventory,
    equipment,
    setEquipment,
  }
}
