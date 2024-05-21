import { groupEquipment } from '../utils';

const HP = /hp:(?<hp>\d+)/;
const SPEED = /spd:(?<speed>\d+)/;
const STATS = [HP, SPEED];

const STRATEGY = /(?<damage>\d+):(?<strategy>.+)/;

export function parse(target, action) {
  // parse first line as a stats block
  const [rawStats, rawStrategies] = action.text.split('\n', 3);
  const text = action.text.slice(rawStats.length + 1 + rawStrategies.length + 1);

  const stats = STATS.reduce((acc, stat) => {
    const { groups } = stat.exec(rawStats);
    return { ...acc, ...groups };
  }, {});
  Object.entries(stats).forEach(([key, value]) => {
    stats[key] = parseInt(value, 10) || value;
  });

  // Build an array for each damage value for the npc's strategy
  const strategyBreakpoints = rawStrategies.split(',').map((part) => {
    const { damage, strategy } = STRATEGY.exec(part).groups;
    return { damage: parseInt(damage, 10), strategy };
  }).concat({ damage: stats.hp, strategy: 'die' });
  const strategies = Array.from({ length: stats.hp + 1 }, (_, i) => {
    const { strategy } = strategyBreakpoints.reduce((acc, { damage, strategy }) => {
      return damage <= i ? { damage, strategy } : acc;
    }, { damage: 0, strategy: null });
    return strategy;
  });

  const equipment = groupEquipment(text);

  return {
    event: 'Fight',
    equipment,
    stats,
    strategies,
    coordinates: target.coordinates,
    sprite: target.sprite,
    text: null,
  };
}
