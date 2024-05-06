export function parse({ text }, { inventory }) {
  return text.split('\n').map((item) => {
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
      price: (rarity + 1) * statValue,
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
};
