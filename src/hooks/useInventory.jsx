import { useState, useCallback } from 'react';

const INVENTORY = {
  arms: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'straight', rarity: 2, name: "Iron sleeves", stats: {D: 4} },
    { id: 3, template: 'pauldrons', rarity: 2, name: "Pauldrons", stats: {D: 6} },
  ],
  body: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'bandit', rarity: 3, name: "Bandit's coat", stats: {D: 2} },
    { id: 3, template: 'full', rarity: 4, name: "Full plate", stats: {D: 9} },
    { id: 4, template: 'harness', rarity: 1, name: "Leather harness", stats: {D: 1} },
    { id: 5, template: 'jacket', rarity: 2, name: "Jacket", stats: {D: 3} },
    { id: 6, template: 'light', rarity: 0, name: "Light armor", stats: {D: 1} },
    { id: 7, template: 'loose', rarity: 0, name: "Loose shirt", stats: {D: 1} },
    { id: 8, template: 'robe', rarity: 0, name: "Robe", stats: {D: 1} },
    { id: 9, template: 'sash', rarity: 0, name: "Sash", stats: {D: 1} },
    { id: 10, template: 'shirt', rarity: 0, name: "Shirt", stats: {D: 1} },
    { id: 11, template: 'toga', rarity: 0, name: "Toga", stats: {D: 1} },
    { id: 12, template: 'tunic', rarity: 0, name: "Tunic", stats: {D: 1} },
  ],
  feet: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'boots', rarity: 2, name: "Boots", stats: {D: 2} },
    { id: 3, template: 'dainty', rarity: 0, name: "Dainty shoes", stats: {D: 1} },
  ],
  hair: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'ponytail', rarity: 0, name: "Ponytail" },
    { id: 3, template: 'short', rarity: 0, name: "Short hair" },
    { id: 4, template: 'long', rarity: 0, name: "Long hair" },
  ],
  head: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'bandana', rarity: 0, name: "Bandana", stats: {D: 0} },
    { id: 3, template: 'hat', rarity: 2, name: "Hat", stats: {D: 0} },
    { id: 4, template: 'helmet', rarity: 2, name: "Iron helmet", stats: {D: 2} },
    { id: 5, template: 'smallhat', rarity: 2, name: "Tiny hat", stats: {D: 0} },
    { id: 6, template: 'warm', rarity: 1, name: "Warm hat", stats: {D: 0} },
  ],
  legs: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'shorts', rarity: 0, name: "Tattered shorts", stats: {D: 0} },
    { id: 3, template: 'shortskirt', rarity: 2, name: "Crooked skirt", stats: {D: 1} },
    { id: 4, template: 'longskirt', rarity: 0, name: "Battle skirt", stats: {D: 2} },
    { id: 5, template: 'loincloth', rarity: 0, name: "Loincloth", stats: {D: 0} },
  ],
  shield: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'board', rarity: 1, name: "Driftwood", stats: {D: 2} },
    { id: 3, template: 'round', rarity: 1, name: "Round shield", stats: {D: 5} },
  ],
  waist: [
    { id: 1, template: 'none', rarity: 0, name: "--" },
    { id: 2, template: 'bag', rarity: 1, name: "Side bag", stats: {D: 0} },
    { id: 3, template: 'bags', rarity: 0, name: "Side bags", stats: {D: 0} },
  ],
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
  head: { id: 4, template: 'helmet', rarity: 2, name: "Iron helmet", stats: {D: 2}},
  body: { id: 5, template: 'jacket', rarity: 3, name: "Jacket", stats: {D: 3}},
  arms: { id: 2, template: 'straight', rarity: 0, name: "Arms"},
  waist: { id: 2, template: 'bag', rarity: 1, name: "Side bag", stats: {D: 0}},
  legs: { id: 3, template: 'shortskirt', rarity: 2, name: "Crooked skirt", stats: {D: 1}},
  feet: { id: 3, template: 'dainty', rarity: 0, name: "Paper bags", stats: {D: 2}},
  weapon: { id: 6, template: 'magicstaff', rarity: 4, name: "Arcane Staff", stats: {D: 1, A: 1} },
  shield: { id: 2, template: 'board', rarity: 1, name: "Driftwood", stats: {D: 2}},
}

export default function useInventory() {
  const [inventory, _setInventory] = useState(INVENTORY);
  const [equipment, _setEquipment] = useState(EQUIPMENT);

  const setEquipment = function(kind, id) {
    const item = inventory[kind].find((item) => item.id === id);
    if (!item) {
      return;
    }
    _setEquipment((equipment) => ({
      ...equipment,
      [kind]: item,
    }));
  };

  return {
    inventory,
    equipment,
    setEquipment,
  }
}
