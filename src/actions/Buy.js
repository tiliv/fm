import { price, EQUIPMENT, EQUIPMENT_ORDER } from '../utils';

export function parse({ text }, { inventory }) {
  const entries = text.split('\n').map((item) => {
    const [kind, template, rarity, name, stat, id=null] = item.split('/');
    if (inventory[kind]?.find((item) => item.name === name)) {
      return null;
    }
    const statValue = parseInt(stat, 10);
    const stats = { [kind === 'weapon' ? 'A' : 'D']: statValue };
    return {
      name,
      kind,
      stats,
      event: 'Buy.player',
      price: -price({ rarity: parseInt(rarity, 10), stats }),
      consume: true,
      item: {
        name,
        template,
        id: id !== null ? parseInt(id, 10) : null,
        rarity: parseInt(rarity, 10),
        stats,
      },
    };
  }).filter(Boolean);

  // Break into groups by kind
  const options = Object.values(entries.reduce((acc, entry) => {
    const { kind } = entry;
    if (!acc[kind]) {
      acc[kind] = { name: EQUIPMENT[kind], _items: [], kind };
    }
    acc[kind]._items.push(entry);
    return acc;
  }, {})).sort((a, b) => {
    return EQUIPMENT_ORDER.indexOf(a.kind) - EQUIPMENT_ORDER.indexOf(b.kind);
  });

  return options;
};
