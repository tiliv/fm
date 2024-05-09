import { ACTIONS } from './Actions';
import * as Load from './actions/Load';
import * as Buy from './actions/Buy';
import * as Sell from './actions/Sell';
import { renderTemplate } from './utils';

const Boxes = /(?<boxes>(\[\d+,\d+,\d+,\d+\];?)*)/.source;
const Directions = /(?<directions>([<>^v]\d+,?)+)/.source;
const RowCol = /\((?<row>\d+),(?<col>\d+)\)/.source;
const NewRowCol = /\((?<newRow>\d+),(?<newCol>\d+)\)/.source;
const Label = /(?<label>[^/#]+)/.source;
const DataFile = /(?<dataFile>\w+\.txt)/.source;
const OptionalInventory = /(?<inventory>(,\$[^,]+)*)/.source;
const OptionalAttributes = /(?<attributes>(#[^=]+=[^#]+)*)/.source;

const ZONE_SPEC = RegExp(`^${DataFile}@${Directions}:${Boxes}${OptionalAttributes}$`);
const WORLD_SPEC = RegExp(`^${RowCol}=${NewRowCol}:${Label}/${DataFile}$`);
const DOOR_SPEC  = RegExp(`^${RowCol}=${NewRowCol}:${Label}${OptionalAttributes}$`);
const NPC_SPEC   = RegExp(`^${RowCol}:${Label}/${DataFile}$`);
const OBJ_SPEC   = RegExp(`^${RowCol}:${Label}${OptionalInventory}${OptionalAttributes}$`);

const TYPE_SPECS = {
  zone: ZONE_SPEC,
  world: WORLD_SPEC,
  npc: NPC_SPEC,
  door: DOOR_SPEC,
  obj: OBJ_SPEC,
};
export const TYPES = Object.fromEntries(
  Object.keys(TYPE_SPECS).map((type) => [type.toUpperCase(), type])
);

export function classifyObjectSpec(line) {
  for (const [type, spec] of Object.entries(TYPE_SPECS)) {
    if (spec.test(line)) {
      const groups = spec.exec(line).groups;
      for (const key of ['row', 'col', 'newRow', 'newCol']) {
        if (groups[key] !== undefined) {
          groups[key] = Number(groups[key]);
        }
      }

      groups.type = type;

      groups.attributes = Object.fromEntries(
        (groups.attributes || '')
        .split('#')
        .filter((attr) => attr.length)
        .map((attr) => attr.split('='))
      );

      // Move boxes into formatted `rects`
      if (groups.boxes !== undefined) {
        groups.boxes = groups.boxes.split(';').map((box) => {
          if (!box) return null;
          return box.slice(1, -1).split(',').map(Number);
        }).filter(Boolean);
        groups.directions = groups.directions.split(',').map((s) => {
          const [dir, amount] = [s[0], Number(s.slice(1))];
          if (dir === '<') return [0, -amount];
          if (dir === '>') return [0, amount];
          if (dir === '^') return [-amount, 0];
          if (dir === 'v') return [amount, 0];
        });
      }

      if (groups.row !== undefined) {
        // Move row & col into `coordinates`
        groups.coordinates = [groups.row, groups.col];
        delete groups.row;
        delete groups.col;

        // Move newRow & newCol into `destination`
        if (groups.newRow !== undefined) {
          groups.destination = [groups.newRow, groups.newCol];
          delete groups.newRow;
          delete groups.newCol;
        }
      }

      return groups;
    }
  }
  throw new Error(`Invalid object spec: ${line}`);
}


export function parseInteraction(interaction, dataFileText, context) {
  const target = JSON.parse(JSON.stringify(interaction));

  // Split data file into initial text categories
  dataFileText.split('---').forEach((item) => {
    const [category] = item.trim().split('\n', 1);
    target[category] = {
      name: category,
      text: renderTemplate(item, context).slice(category.length + 1).trim()
    };
  });

  switch (target.type) {
    case (TYPES.NPC):
      amendNPC(target, context);
      break;
    case (TYPES.DOOR):
      amendDoor(target, context);
      break;
    case (TYPES.WORLD):
      amendWorld(target, context);
      break;
    case (TYPES.OBJ):
      amendObj(target, context);
      break;
  }

  return target;
}


function amendNPC(target, {}) {
  // We save the original action before overwriting it so that we have a
  // reference in a closure for the `items` functions.  We clear text from the
  // object so that `items` takes clear precedence when displayed.
  // The text may be relevant because it can be parsed as configuration for
  // the items functions.

  target.name = target.dataFile.replace(/\.txt$/, '');
  target.name = target.name[0].toUpperCase() + target.name.slice(1);

  if (target[ACTIONS.BUY] !== undefined) {
    let action = JSON.parse(JSON.stringify(target[ACTIONS.BUY]));
    Object.assign(target[ACTIONS.BUY], {
      items: ({ inventory }) => Buy.parse(target, action, { inventory }),
      text: null,
    });
  }

  if (target[ACTIONS.SELL] !== undefined) {
    let action = JSON.parse(JSON.stringify(target[ACTIONS.SELL]));
    Object.assign(target[ACTIONS.SELL], {
      items: ({ inventory }) => Sell.parse(target, action, { inventory }),
      text: null,
    });
  }

  if (target.Save !== undefined) {
    target.Save.event = 'Save';
  }

  if (target.Load !== undefined) {
    Object.assign(target.Load, {
      items: Load.list().map((slot) => ({ slot, name: slot, event: 'Load' })),
      text: null,
    });
  }
}

function amendDoor(target, { possesses }) {
  const { destination, attributes: { key, text }={} } = target;
  if (!key || possesses('ring', key)) {
    target.Open = { name: 'Open', text: null, event: 'destination', destination };
  } else {
    target.Open = { name: 'Open', text: text || "This door seems locked." };
  }
}

function amendWorld(target, {}) {
  const { destination, dataFile } = target;
  target.Enter = { name: 'Enter', text: null, event: 'destination', destination, dataFile };
}

function amendObj(target, {}) {
  const { attributes={} } = target;
  Object.entries(attributes)
    .filter(([name]) => /^[A-Z]/.test(name))
    .map(([name, text]) => {
      target[name] = { name, text };
    })
    ;
  // target.Inspect = { name: 'Inspect', text: null };
  return;
}
