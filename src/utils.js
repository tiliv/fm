import { ACTIONS } from './Actions';
import * as Load from './actions/Load';
import * as Sell from './actions/Sell';

export function renderTemplate (tmpl, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const func = new Function(...keys, `return \`${tmpl}\`;`);
  return func(...values);
};


const KEY_ALIASES = {
  ArrowDown: '↓',
  ArrowUp: '↑',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': 'space',
}

export function keyAlias(key) {
  return KEY_ALIASES[key] || key;
}


export function parseInventory({ inventory='' }) {
  return inventory.replace(/^,/, '').split(',')
    .filter((item) => item.startsWith('$'))
    .map((item) => {
      const [kind, template, rarity, name, stat, id=null] = item.slice(1).split('/');
      return {
        name,
        kind,
        template,
        id: id !== null ? parseInt(id, 10) : null,
        rarity: parseInt(rarity, 10),
        stats: { [kind === 'weapon' ? 'A' : 'D']: parseInt(stat, 10) },
      };
    });
}

// export function unparseInventory(kind, items) {
//   return items.map(({ id, template, rarity, name, stats }) => {
//     return `$${kind}/${template}/${rarity}/${name}/${stats.D || stats.A}/${id}`;
//   }).join(',');
// }


export function parseInteraction(interaction, dataFileText, { name, inventory }) {
  const items = dataFileText.split('---');
  const actions = {...interaction};
  items.forEach((item) => {
    const [category] = item.trim().split('\n', 1);
    actions[category] = renderTemplate(item, { name }).slice(category.length + 1).trim();
  });
  const theirInventory = parseInventory(actions);
  if (theirInventory.length > 0) {
    actions[ACTIONS.BUY] = theirInventory.map((item) => ({ ...item, buyer: 'player' }));
  }
  if (actions.Load !== undefined) {
    actions.Load = Load.list().map((name) => ({ name }));
  }
  if (actions.Sell !== undefined) {
    actions.Sell = Sell.parse(actions.Sell, { interaction, inventory });
  }
  return actions;
}


const MINI_NUMBERS = '₀₁₂₃₄₅₆₇₈₉⏨'
export function minifyNumbers(str) {
  return `${str}`.replace(/\d/g, (match) => MINI_NUMBERS[match]);
}

export function bufferize(topMargin, text, width, height, scrollOffset) {
  const buffer = [];
  const words = text.split(' ');
  let currentLine = [];

  words.forEach(word => {
    if (currentLine.join(' ').length + word.length + 1 > width) {
      buffer.push(currentLine);
      currentLine = [];
    }
    currentLine.push(word);
  });

  if (currentLine.length > 0) {
    buffer.push(currentLine);
  }

  const scrolledBuffer = buffer
    .slice(scrollOffset, scrollOffset + height - topMargin)
    .map(line => line.join(' '));
  scrolledBuffer.unshift(...Array(topMargin).fill(''));
  return scrolledBuffer;
}

export function bufferizeList(topMargin, buffer, width, height, scrollOffset) {
  const scrolledBuffer = buffer
    .slice(scrollOffset, scrollOffset + height - topMargin);
  scrolledBuffer.unshift(...Array(topMargin).fill(''));
  return scrolledBuffer;
}
