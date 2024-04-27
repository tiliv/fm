import { useState, useEffect } from 'react';

import useSave from './useSave';

const CATEGORIES = [
  'hair',
  'head',
  'body',
  'arms',
  'waist',
  'legs',
  'feet',
  'weapon',
  'shield',
];

export default function useInventory(subject) {
  const [inventory, setInventory] = useState(
    Object.fromEntries(CATEGORIES.map((category) => [category, []]))
  );
  const [equipment, setEquipment] = useState(
    Object.fromEntries(CATEGORIES.map((category) => [category, null]))
  );

  useSave({
    [`${subject}/inventory`]: [inventory, setInventory],
    [`${subject}/equipment`]: [equipment, setEquipment],
  });

  // Player responds to Buy event
  useEffect(() => {
    if (subject !== 'player') return;
    const buy = function({ detail: {kind, ...item} }) {
      acquire(kind, item);  // fixme: bought items don't have an id
    };
    window.addEventListener('Buy', buy);
    return () => window.removeEventListener('Buy', buy);
  }, [subject]);

  const equip = function(kind, id) {
    setEquipment((equipment) => ({
      ...equipment,
      [kind]: id,
    }));
  };

  const acquire = function(kind, item) {
    const maxId = inventory[kind].reduce(
      // missing ids are an error but need to be passed over without damaging the math
      (max, { id=0 }) => Math.max(max, id),
      0
    );
    setInventory((inventory) => ({
      ...inventory,
      [kind]: [...inventory[kind], { ...item, id: maxId + 1 }],
    }));
  };

  return {
    inventory,
    equipment,
    equip,
    acquire,
  };
}
