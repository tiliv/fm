import { useState } from 'react';

export default function useStats() {
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [mp, setMp] = useState(100);
  const [strength, setStrength] = useState(10);
  const [defense, setDefense] = useState(5);
  const [speed, setSpeed] = useState(5);

  return {
    name: localStorage.getItem('latest'),
    hp, maxHp,
    mp,
    strength,
    defense,
    speed,
  };
}
