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

const EMPTY_INVENTORY = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
const EMPTY_EQUIPMENT = Object.fromEntries(CATEGORIES.map((category) => [category, null]));

export default function useInventory(subject, {
  startInventory=EMPTY_INVENTORY,
  startEquipment=EMPTY_EQUIPMENT,
}={}) {
  // const [softId] = useState(Math.floor(Math.random() * 1000));
  const [inventory, setInventory] = useState(startInventory);
  const [equipment, setEquipment] = useState(startEquipment);

  useSave({
    [`${subject}/inventory`]: [inventory, setInventory],
    [`${subject}/equipment`]: [equipment, setEquipment],
  });

  // Respond to 'Buy' event
  useEffect(() => {
    const eventName = `Buy.${subject}`;
    const buy = function({ detail: { kind, ...item } }) {
      setTimeout(() => {
        const acquire = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
        window.dispatchEvent(acquire);
      }, 0);
    };
    window.addEventListener(eventName, buy);
    return () => window.removeEventListener(eventName, buy);
  }, [subject]);

  // Respond to 'Acquire' event, either chained from a 'Buy' or triggered directly
  useEffect(() => {
    const eventName = `Acquire.${subject}`;
    const acquire = function({ detail: { kind, item } }) {
      setInventory((inventory) => {
        const existing = inventory[kind] || [];
        const maxId = existing.reduce(
          (max, { id }) => Math.max(max, id),
          0
        );
        return {
          ...inventory,
          [kind]: [...existing, { ...item, id: maxId + 1 }],
        }
      });
    }
    window.addEventListener(eventName, acquire);
    return () => window.removeEventListener(eventName, acquire);
  }, [subject]);

  // Respond to 'Equip' event
  useEffect(() => {
    const eventName = `Equip.${subject}`;
    const handler = function({ detail: { kind, id } }) {
      setEquipment((equipment) => ({ ...equipment, [kind]: id }));
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [subject]);

  // Convenience triggers
  const equip = function(kind, id) {
    const equip = new CustomEvent(`Equip.${subject}`, { detail: { kind, id } });
    window.dispatchEvent(equip);
  };

  const acquire = function(kind, item) {
    const acquire = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
    window.dispatchEvent(acquire);
  }

  return {
    inventory,
    equipment,
    equip,
    acquire,
  };
}
