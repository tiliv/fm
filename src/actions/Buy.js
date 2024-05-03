export function parse({ text }) {
  return text.split('\n').map((item) => {
    const [kind, template, rarity, name, stat, id=null] = item.split('/');
    return {
      name,
      kind,
      template,
      event: 'Buy.player',
      id: id !== null ? parseInt(id, 10) : null,
      rarity: parseInt(rarity, 10),
      stats: { [kind === 'weapon' ? 'A' : 'D']: parseInt(stat, 10) },
    };
  });
};
