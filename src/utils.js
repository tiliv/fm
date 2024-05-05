import { ACTIONS } from './Actions';
import * as Load from './actions/Load';
import * as Buy from './actions/Buy';
import * as Sell from './actions/Sell';

const KEY_ALIASES = {
  ArrowDown: '↓',
  ArrowUp: '↑',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': 'space',
}

export function renderTemplate (tmpl, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const func = new Function(...keys, `return \`${tmpl}\`;`);
  return func(...values);
};

export function keyAlias(key) {
  return KEY_ALIASES[key] || key;
}

export function parseInteraction(interaction, dataFileText, { name, inventory }) {
  const items = dataFileText.split('---');
  const actions = JSON.parse(JSON.stringify(interaction));
  items.forEach((item) => {
    const [category] = item.trim().split('\n', 1);
    actions[category] = {
      name: category,
      text: renderTemplate(item, { name }).slice(category.length + 1).trim()
    };
  });
  if (actions[ACTIONS.BUY] !== undefined) {
    const { text: textBuy } = actions[ACTIONS.BUY];
    Object.assign(actions[ACTIONS.BUY], {
      items: ({ inventory }) => Buy.parse({ text: textBuy }, { inventory }),
      text: null,
    });
  }
  if (actions[ACTIONS.SELL] !== undefined) {
    const { text: textSell } = actions[ACTIONS.SELL];
    Object.assign(actions[ACTIONS.SELL], {
      items: ({ inventory }) => Sell.parse({ text: textSell }, { inventory }),
      text: null,
    });
  }
  if (actions.Save !== undefined) {
    actions.Save.event = 'Save';
  }
  if (actions.Load !== undefined) {
    Object.assign(actions.Load, {
      items: Load.list().map((slot) => ({ slot, name: slot, event: 'Load' })),
      text: null,
    });
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
