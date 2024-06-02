import { useState, useEffect, useCallback, useRef } from 'react';

import useSave from './useSave';
import useEvent from './useEvent';

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

  useEffect(() => {
    stats.current = { name, hp, strength, defense, speed, gold };
  }, [name, hp, strength, defense, speed, gold]);

  const addLog = useCallback(function(msg) {
    setLog((log) => [msg, ...log]);
  }, []);
  const buy = useBuy({ subject, setGold, addLog });
  const sell = useSell({ subject, setGold, addLog });
  const equip = useEquip({ subject, inventory, setEquipment, setStrength, setDefense });
  const acquire = useAcquire({ subject, setInventory, addLog });
  const drop = useDrop({ subject, setInventory });
  const sleep = useSleep({ subject, setHp, addLog });
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
    handlers.current = { buy, sell, equip, acquire, drop, sleep, possesses };
  }, [buy, sell, equip, acquire, drop, sleep, possesses])

  return {
    stats,
    handlers,
    inventory, equipment, log,
  };
}


function useSell({ subject, setGold, addLog }) {
  const sellHandler = useCallback(({ detail: { kind, price, target, item } }) => {
    setGold((gold) => gold + price);
    addLog(`Sold ${item.name} to ${target.name}.`);
    setTimeout(() => {
      const drop = new CustomEvent(`Drop.${subject}`, { detail: { kind, item } });
      window.dispatchEvent(drop);
      const acquire = new CustomEvent(`Acquire.${target.name}`, { detail: { kind, item } });
      window.dispatchEvent(acquire);
    }, 0);
  }, [subject]);
  useEvent(`Sell.${subject}`, sellHandler);

  const sellTrigger = useCallback(function(kind, price, item, target) {
    const event = new CustomEvent(`Sell.${subject}`, { detail: { kind, price, target, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return sellTrigger;
};


function useBuy({ subject, setGold, addLog }) {
  const buyHandler = useCallback(({ detail: { kind, price, target, item } }) => {
    setGold((gold) => {
      if (gold + price < 0) return gold;
      addLog(`Bought ${item.name} from ${target.name}.`);
      setTimeout(() => {
        const acquire = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
        window.dispatchEvent(acquire);
      }, 0);
      return gold + price;
    });
  }, [subject]);
  useEvent(`Buy.${subject}`, buyHandler);

  const buyTrigger = useCallback(function(kind, price, item, target) {
    const event = new CustomEvent(`Buy.${subject}`, { detail: { kind, price, target, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return buyTrigger;
}


function useAcquire({ subject, setInventory }) {
  const acquireHandler = useCallback(function({ detail: { kind, item } }) {
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
  }, []);
  useEvent(`Acquire.${subject}`, acquireHandler);

  const acquireTrigger = useCallback(function(kind, item) {
    const event = new CustomEvent(`Acquire.${subject}`, { detail: { kind, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return acquireTrigger;
}


function useDrop({ subject, setInventory }) {
  const dropHandler = useCallback(function({ detail: { kind, item } }) {
    setInventory((inventory) => {
      const existing = inventory[kind] || [];
      return {
        ...inventory,
        [kind]: existing.filter(({ id }) => id !== item.id),
      };
    });
  }, []);
  useEvent(`Drop.${subject}`, dropHandler);

  const dropTrigger = useCallback(function(kind, item) {
    const event = new CustomEvent(`Drop.${subject}`, { detail: { kind, item } });
    window.dispatchEvent(event);
  }, [subject]);

  return dropTrigger;
}


function useEquip({ subject, inventory, setEquipment, setStrength, setDefense }) {
  const equipHandler = useCallback(function({ detail: { kind, id } }) {
    const type = kind.startsWith('ring') ? 'ring' : kind;
    const {
      stats: { A=0, D=0 }={},
    } = inventory[type].find(({ id: itemId }) => itemId === id) || {};
    setEquipment((equipment) => {
      const {
        stats: { A: priorA=0, D: priorD=0 }={},
      } = inventory[type].find(({ id: itemId }) => itemId === equipment[kind]) || {};
      const newEquipment = { ...equipment, [kind]: id };
      setStrength((strength) => strength + A - priorA);
      setDefense((defense) => defense + D - priorD);
      return newEquipment;
    });
  }, [inventory]);
  useEvent(`Equip.${subject}`, equipHandler);

  const equipTrigger = useCallback(function(kind, id) {
    const event = new CustomEvent(`Equip.${subject}`, { detail: { kind, id } });
    window.dispatchEvent(event);
  }, [subject]);

  return equipTrigger;
}


function useSleep({ subject, setHp, addLog }) {
  const sleepHandler = useCallback(function({ detail: { quality } }) {
    setHp((hp) => {
      const newHp = Math.max(hp, quality);
      if (hp >= quality) {
        addLog(`Slept, but you feel about the same.`)
      } else {
        addLog(`Slept well, and healed to ${quality}.`);
      }
      return newHp;
    });
  }, []);
  useEvent(`Sleep.${subject}`, sleepHandler);

  const sleepTrigger = useCallback(function(quality) {
    const event = new CustomEvent(`Sleep.${subject}`, { detail: { quality } });
    window.dispatchEvent(event);
  }, [subject]);

  return sleepTrigger;
}
