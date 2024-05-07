import { price, EQUIPMENT } from '../utils';

export function parse({ text }, { inventory }) {
  return text.split(',').map((kind) => {
    if (EQUIPMENT[kind] !== undefined) {
      return {
        name: EQUIPMENT[kind],
        items: ({ inventory }) => (inventory[kind] || []).map((item) => {
          return {
            name: item.name,
            stats: item.stats,
            item,
            kind,
            price: price(item),
            event: `Sell.player`,
            consume: true,
          }
        }),
      };
    }
    return { name: kind };
  });
}
