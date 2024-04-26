import { useState, useEffect } from 'react';

import { parseInventory, unparseInventory } from '../utils';

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

function getInventoryType(subject, kind) {
  const saveSlot = localStorage.getItem('latest');
  const key = `${saveSlot}/${subject}/inventory/${kind}`;
  const itemsString = localStorage.getItem(key) || '';
  const items = parseInventory({ inventory: itemsString });
  return items;
}

function setInventoryType(subject, kind, items) {
  const saveSlot = localStorage.getItem('latest');
  const key = `${saveSlot}/${subject}/inventory/${kind}`;
  const itemsString = unparseInventory(kind, items);
  localStorage.setItem(key, itemsString);
}

function getEquipmentType(subject, kind) {
  const saveSlot = localStorage.getItem('latest');
  const key = `${saveSlot}/${subject}/equipped/${kind}`;
  const id = localStorage.getItem(key);
  return parseInt(id, 10) || null;
};

function setEquipmentType(subject, kind, id) {
  const saveSlot = localStorage.getItem('latest');
  const key = `${saveSlot}/${subject}/equipped/${kind}`;
  localStorage.setItem(key, id);
};

export default function useInventory(subject) {
  const [inventory, setInventory] = useState({});
  const [equipment, setEquipment] = useState({});

  useEffect(() => {
    // respond to Buy event
    const buy = function({ detail: {kind, ...item} }) {
      acquire(kind, item);  // fixme: bought items don't have an id
    };
    window.addEventListener('Buy', buy);
    return () => window.removeEventListener('Buy', buy);
  });

  useEffect(() => {
    const inventory = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
    const equipment = Object.fromEntries(CATEGORIES.map((category) => [category, null]));
    CATEGORIES.forEach((kind) => {
      const items = getInventoryType(subject, kind);
      const equipped = getEquipmentType(subject, kind);
      inventory[kind].push(...items);
      equipment[kind] = inventory[kind].find(({ id }) => id === equipped)?.id || null;
    });
    setInventory(inventory);
    setEquipment(equipment);
  }, [subject]);

  const equip = function(kind, id) {
    setEquipment((equipment) => {
      const newEquipment = {
        ...equipment,
        [kind]: id,
      };
      setEquipmentType(subject, kind, newEquipment[kind]);
      return newEquipment;
    });
  };

  const acquire = function(kind, item) {
    const maxId = inventory[kind].reduce(
      // missing ids are an error but need to be passed over without damaging the math
      (max, { id=0 }) => Math.max(max, id),
      0
    );
    setInventory((inventory) => {
      const newInventory = {
        ...inventory,
        [kind]: [...inventory[kind], { ...item, id: maxId + 1 }],
      };
      setInventoryType(subject, kind, newInventory[kind])
      return newInventory;
    });
  };

  return {
    inventory,
    equipment,
    equip,
    acquire,
  }
}
