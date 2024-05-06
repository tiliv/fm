import { ACTIONS } from './Actions';
import * as Load from './actions/Load';
import * as Buy from './actions/Buy';
import * as Sell from './actions/Sell';
import { renderTemplate } from './utils';

const RowCol = "(?<row>\\d+),(?<col>\\d+)";
const NewRowCol = "(?<newRow>\\d+),(?<newCol>\\d+)";
const Label = "(?<label>[^/#]+)";
const DataFile = "(?<dataFile>\\w+\\.txt)";
const OptionalInventory = "(?<inventory>(,\\$[^,]+)*)";
const OptionalAttributes = "(?<attributes>(#[^=]+=[^#]+)*)";

const WORLD_SPEC = RegExp(`^${RowCol}=${NewRowCol}:${Label}/${DataFile}$`);
const DOOR_SPEC  = RegExp(`^${RowCol}=${NewRowCol}:${Label}${OptionalAttributes}$`);
const NPC_SPEC   = RegExp(`^${RowCol}:${Label}/${DataFile}$`);
const OBJ_SPEC   = RegExp(`^${RowCol}:${Label}${OptionalInventory}${OptionalAttributes}$`);

const TYPE_SPECS = {
  world: WORLD_SPEC,
  npc: NPC_SPEC,
  door: DOOR_SPEC,
  obj: OBJ_SPEC,
};
const TYPES = Object.fromEntries(
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


function amendNPC(target, { inventory }) {
  // We save `text` from original before overwriting it so that we have a
  // reference in a closure for the `items` functions.  We clear text from the
  // object so that `items` takes clear precedence when displayed.
  // The text may be relevant because it can be parsed as configuration for
  // the items functions.

  if (target[ACTIONS.BUY] !== undefined) {
    let { text } = target[ACTIONS.BUY];
    Object.assign(target[ACTIONS.BUY], {
      items: ({ inventory }) => Buy.parse({ text }, { inventory }),
      text: null,
    });
  }

  if (target[ACTIONS.SELL] !== undefined) {
    let { text } = target[ACTIONS.SELL];
    Object.assign(target[ACTIONS.SELL], {
      items: ({ inventory }) => Sell.parse({ text }, { inventory }),
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

function amendWorld(target, { inventory }) {
  const { destination, dataFile } = target;
  target.Enter = { name: 'Enter', text: null, event: 'destination', destination, dataFile };
}

function amendObj(target, { inventory }) {
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
