import { price, EQUIPMENT } from '../utils';

export function parse(target, action) {
  return {
    items: (context) => makeItems(target, action, context),
    text: null,
  };
}

function makeItems(target, { text }, context) {
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
            target,
            price: price(item),
            event: 'Sell.player',
            consume: true,
          }
        }),
      };
    }
    return { name: kind };
  });
}
