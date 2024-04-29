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

  // // Sync with existing
  // useEffect(() => {
  //   // Respond to 'sync-inventory' when softId doesn't match ours
  //   const get = function({ detail, id }) {
  //     if (subject !== detail || softId === id) return;  // ignore off topic and self
  //     const reply = new CustomEvent('set-inventory', { detail, id, inventory, equipment });
  //     window.dispatchEvent(reply);
  //   };
  //   const set = function({ detail, id, inventory, equipment }) {
  //     if (subject !== detail || softId !== id) return;  // ignore off topic and others
  //     setInventory(inventory);
  //     setEquipment(equipment);
  //   };
  //   window.addEventListener('get-inventory', get);
  //   window.addEventListener('set-inventory', set);

  //   const event = new CustomEvent('get-inventory', { detail: subject, id: softId });
  //   window.dispatchEvent(event);
  // }, [subject]);

  // Respond to 'Buy' event
  useEffect(() => {
    const buy = function({ detail: { buyer, kind, ...item } }) {
      if (subject !== buyer) return;
      const acquire = new CustomEvent('Acquire', { detail: { recipient: subject, kind, item } });
      // console.log(subject, 'Buy', item);
      window.dispatchEvent(acquire);
    };
    window.addEventListener('Buy', buy);
    return () => window.removeEventListener('Buy', buy);
  }, [subject]);

  // Respond to 'Acquire' event, either chained from a 'Buy' or triggered directly
  useEffect(() => {
    const acquire = function({ detail: { recipient, kind, item } }) {
      if (subject !== recipient) return;
      // console.log(recipient, 'Acquire', item);
      const maxId = inventory[kind].reduce(
        (max, { id }) => Math.max(max, id),
        0
      );
      setInventory((inventory) => ({
        ...inventory,
        [kind]: [...inventory[kind], { ...item, id: maxId + 1 }],
      }));
    }
    window.addEventListener('Acquire', acquire);
    return () => window.removeEventListener('Acquire', acquire);
  }, [subject]);

  // Respond to 'Equip' event
  useEffect(() => {
    const handler = function({ detail: { holder, kind, id } }) {
      if (subject !== holder) return;
      // console.log(holder, 'Equip', kind, id);
      setEquipment((equipment) => ({ ...equipment, [kind]: id }));
    };
    window.addEventListener('Equip', handler);
    return () => window.removeEventListener('Equip', handler);
  }, [subject]);

  // Convenience triggers
  const equip = function(kind, id) {
    const equip = new CustomEvent('Equip', { detail: { holder: subject, kind, id } });
    window.dispatchEvent(equip);
  };

  const acquire = function(kind, item) {
    const acquire = new CustomEvent('Acquire', { detail: { recipient: subject, kind, item } });
    window.dispatchEvent(acquire);
  }

  return {
    inventory,
    equipment,
    equip,
    acquire,
  };
}
