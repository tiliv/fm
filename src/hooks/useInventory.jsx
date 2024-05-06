import { useState, useEffect, useCallback } from 'react';

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
  'ring',
];

const EMPTY_GOLD = 0;
const EMPTY_INVENTORY = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
const EMPTY_EQUIPMENT = Object.fromEntries(CATEGORIES.map((category) => [category, null]));

export default function useInventory(subject, {
  startGold=EMPTY_GOLD,
  startInventory=EMPTY_INVENTORY,
  startEquipment=EMPTY_EQUIPMENT,
}={}) {
  const [gold, setGold] = useState(startGold);
  const [inventory, setInventory] = useState(startInventory);
  const [equipment, setEquipment] = useState(startEquipment);

  useSave({
    [`${subject}/gold`]: [gold, setGold],
    [`${subject}/inventory`]: [inventory, setInventory],
    [`${subject}/equipment`]: [equipment, setEquipment],
  });

  const buy = useBuy({ subject, setGold });
  const sell = useSell({ subject, setGold });
  const equip = useEquip({ subject, setEquipment });
  const acquire = useAcquire({ subject, setInventory });
  const drop = useDrop({ subject, setInventory });

  const possesses = useCallback(function(kind, identifier) {
    function findEquipped(slot, kind=null) {
      return inventory[kind || slot].find(({ id, name }) => {
        return (equipment[slot] === id) && [id, name].includes(
          parseInt(identifier, 10) || identifier
        );
      });
    }

    if (kind === 'ring') {
      return Object.keys(equipment).find((slot) => (
        slot.startsWith('ring') && findEquipped(slot, kind)
      ));
    }
    return findEquipped(kind);
  }, [equipment, inventory]);

  return {
    gold, inventory, equipment, possesses,
    buy, sell, equip, acquire, drop,
  };
}


function useSell({ subject, setGold }) {
  useEffect(() => {
    const eventName = `Sell.${subject}`;
    const sell = function({ detail: { kind, price, target, item } }) {
      // console.log('Selling', item, 'for', price, 'to', target);
      setGold((gold) => gold + price);
      setTimeout(() => {
        const drop = new CustomEvent(`Drop.${subject}`, { detail: { kind, item } });
        window.dispatchEvent(drop);
        const acquire = new CustomEvent(`Acquire.${target}`, { detail: { kind, item } });
        window.dispatchEvent(acquire);
      }, 0);
    }
    window.addEventListener(eventName, sell);
    return () => window.removeEventListener(eventName, sell);
  }, [subject]);

  const sell = useCallback(function(kind, price, item, target) {
    const event = new CustomEvent(`Sell.${subject}`, { detail: { kind, price, target, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return sell;
};


function useBuy({ subject, setGold }) {
  useEffect(() => {
    const eventName = `Buy.${subject}`;
    const buy = function({ detail: { kind, price, item } }) {
      setGold((gold) => gold - price);
      setTimeout(() => {
        const acquire = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
        window.dispatchEvent(acquire);
      }, 0);
    };
    window.addEventListener(eventName, buy);
    return () => window.removeEventListener(eventName, buy);
  }, [subject]);

  const buy = useCallback(function(kind, item) {
    const event = new CustomEvent(`Buy.${subject}`, { detail: { kind, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return buy;
}


function useAcquire({ subject, setInventory }) {
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

  const acquire = useCallback(function(kind, item) {
    const event = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return acquire;
}


function useDrop({ subject, setInventory }) {
  useEffect(() => {
    const eventName = `Drop.${subject}`;
    const drop = function({ detail: { kind, item } }) {
      // console.log('Dropping', item, 'from', kind);
      setInventory((inventory) => {
        const existing = inventory[kind] || [];
        return {
          ...inventory,
          [kind]: existing.filter(({ id }) => id !== item.id),
        };
      });
    }
    window.addEventListener(eventName, drop);
    return () => window.removeEventListener(eventName, drop);
  }, [subject]);

  const drop = useCallback(function(kind, item) {
    const event = new CustomEvent(`Drop.${subject}`, { detail: { kind, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return drop;
}


function useEquip({ subject, setEquipment }) {
  // Respond to 'Equip' event
  useEffect(() => {
    const eventName = `Equip.${subject}`;
    const handler = function({ detail: { kind, id } }) {
      setEquipment((equipment) => ({ ...equipment, [kind]: id }));
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [subject]);

  const equip = useCallback(function(kind, id) {
    const event = new CustomEvent(`Equip.${subject}`, { detail: { kind, id } });
    window.dispatchEvent(event);
  }, [subject]);

  return equip;
}
