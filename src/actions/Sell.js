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

export function parse({ text }, { interaction, inventory }) {
  return text.split(',').map((kind) => {
    if (EQUIPMENT[kind] !== undefined) {
      return { name: EQUIPMENT[kind], items: inventory[kind] || [] };
    }
    return { name: kind };
  });
}
