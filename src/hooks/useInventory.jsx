import { useState, useEffect, useCallback, useRef } from 'react';

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

const EMPTY_GOLD = 30;
const EMPTY_INVENTORY = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
const EMPTY_EQUIPMENT = Object.fromEntries(CATEGORIES.map((category) => [category, null]));

export default function useInventory(subject, {
  startLog=[],
  startGold=EMPTY_GOLD,
  startInventory=EMPTY_INVENTORY,
  startEquipment=EMPTY_EQUIPMENT,
}={}) {
  const [hp, setHp] = useState(100);
  const [strength, setStrength] = useState(0);
  const [defense, setDefense] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [gold, setGold] = useState(startGold);
  const [inventory, setInventory] = useState(startInventory);
  const [equipment, setEquipment] = useState(startEquipment);
  const [log, setLog] = useState(startLog);

  const name = localStorage.getItem('latest');

  const stats = useRef({});
  const handlers = useRef({});

  useSave({
    [`${subject}/hp`]: [hp, setHp],
    [`${subject}/strength`]: [strength, setStrength],
    [`${subject}/defense`]: [defense, setDefense],
    [`${subject}/speed`]: [speed, setSpeed],
    [`${subject}/gold`]: [gold, setGold],
    [`${subject}/inventory`]: [inventory, setInventory],
    [`${subject}/equipment`]: [equipment, setEquipment],
    [`${subject}/log`]: [log, setLog],
  });

  const addLog = useCallback(function(msg) {
    setLog((log) => [msg, ...log]);
  }, []);

  const buy = useBuy({ subject, setGold, addLog });
  const sell = useSell({ subject, setGold, addLog });
  const equip = useEquip({ subject, setEquipment });
  const acquire = useAcquire({ subject, setInventory, addLog });
  const drop = useDrop({ subject, setInventory });

  useSleep({ subject, hp, setHp, addLog });

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

  useEffect(() => {
    stats.current = { name, hp, strength, defense, speed, gold };
  }, [name, hp, strength, defense, speed, gold]);

  useEffect(() => {
    handlers.current = { buy, sell, equip, acquire, drop, possesses };
  }, [buy, sell, equip, acquire, drop, possesses])

  return {
    stats,
    handlers,
    inventory, equipment, log,
  };
}


function useSell({ subject, setGold, addLog }) {
  useEffect(() => {
    const eventName = `Sell.${subject}`;
    const sell = function({ detail: { kind, price, target, item } }) {
      // console.log('Selling', item, 'for', price, 'to', target);
      setGold((gold) => gold + price);
      addLog(`Sold ${item.name} to ${target.name}.`);
      setTimeout(() => {
        const drop = new CustomEvent(`Drop.${subject}`, { detail: { kind, item } });
        window.dispatchEvent(drop);
        const acquire = new CustomEvent(`Acquire.${target.name}`, { detail: { kind, item } });
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


function useBuy({ subject, setGold, addLog }) {
  useEffect(() => {
    const eventName = `Buy.${subject}`;
    const buy = function({ detail: { kind, price, target, item } }) {
      setGold((gold) => {
        if (gold + price < 0) return gold;
        addLog(`Bought ${item.name} from ${target.name}.`);
        setTimeout(() => {
          const acquire = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
          window.dispatchEvent(acquire);
        }, 0);
        return gold + price;
      });
    };
    window.addEventListener(eventName, buy);
    return () => window.removeEventListener(eventName, buy);
  }, [subject]);

  const buy = useCallback(function(kind, price, item, target) {
    const event = new CustomEvent(`Buy.${subject}`, { detail: { kind, price, target, item } });
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


function useEquip({ subject, inventory, setEquipment, setStrength, setDefense }) {
  // Respond to 'Equip' event
  useEffect(() => {
    const eventName = `Equip.${subject}`;
    const handler = function({ detail: { kind, id } }) {
      const {
        stats: { A=0, D=0 }={},
      } = inventory[kind].find(({ id: itemId }) => itemId === id) || {};
      setEquipment((equipment) => {
        const {
          stats: { A: priorA=0, D: priorD=0 }={},
        } = inventory[kind].find(({ id: itemId }) => itemId === equipment[kind]) || {};
        const newEquipment = { ...equipment, [kind]: id };
        setStrength((strength) => strength + A - priorA);
        setDefense((defense) => defense + D - priorD);
        return newEquipment;
      });
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [subject, inventory]);

  const equip = useCallback(function(kind, id) {
    const event = new CustomEvent(`Equip.${subject}`, { detail: { kind, id } });
    window.dispatchEvent(event);
  }, [subject]);

  return equip;
}


function useSleep({ subject, hp, setHp, addLog }) {
  useEffect(() => {
    const eventName = `Sleep.${subject}`;
    const handler = function({ detail: { quality } }) {
      setHp((hp) => {
        const newHp = Math.max(hp, quality);
        if (hp >= quality) {
          addLog(`Slept, but you feel about the same.`)
        } else {
          addLog(`Slept well, and healed to ${quality}.`);
        }
        return newHp;
      });
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [subject]);

  const sleep = useCallback(function(quality) {
    const event = new CustomEvent(`Sleep.${subject}`, { detail: { quality } });
    window.dispatchEvent(event);
  }, [subject]);

  return sleep;
}
