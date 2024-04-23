export function parse({ inventory='' }) {
  return inventory.replace(/^,/, '').split(',')
    .filter((item) => item.startsWith('$'))
    .map((item) => {
      const [kind, template, rarity, name, stat] = item.slice(1).split('/');
      return { kind, template, name, rarity: parseInt(rarity, 10), stats: {
        [template === 'weapon' ? 'A' : 'D']: parseInt(stat, 10),
      }};
    });
}
