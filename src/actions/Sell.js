import { price } from '../utils';

export const EQUIPMENT = {
  weapon: "Weapons",
  body: "Body armor",
  legs: "Leggings",
  feet: "Footwear",
  head: "Headgear",
  arms: "Sleeves",
  shield: "Shields",
  waist: "Waist gear",
}

export function parse({ text }, { inventory }) {
  return text.split(',').map((kind) => {
    if (EQUIPMENT[kind] !== undefined) {
      return {
        name: EQUIPMENT[kind],
        items: (inventory[kind] || []).map((item) => {
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
