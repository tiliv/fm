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


// Should include `row`, `col`
// Use `label` for objects that will display a target name on the menu screen
// Use `type` & `npc` for a file in a folder at `type/npc`
// Use `world` for a file in the `world` folder
const WORLD_SPEC = RegExp(`^(?<row>\\d+),(?<col>\\d+)=(?<newRow>\\d+),(?<newCol>\\d+):(?<label>[^/]+)/(?<dataFile>\\w+\\.txt)$`);
const DOOR_SPEC = RegExp(`^(?<row>\\d+),(?<col>\\d+)=(?<newRow>\\d+),(?<newCol>\\d+):(?<label>.+)$`);
const NPC_SPEC = RegExp(`^(?<row>\\d+),(?<col>\\d+):(?<label>\\w+)/(?<dataFile>\\w+\\.txt)$`);
const OBJ_SPEC = RegExp(`^(?<row>\\d+),(?<col>\\d+):(?<label>.+)$`);

const objectSpecs = {
  world: WORLD_SPEC,
  npc: NPC_SPEC,
  door: DOOR_SPEC,
  obj: OBJ_SPEC,
};

export function classifyObjectSpec(line) {
  for (const [type, spec] of Object.entries(objectSpecs)) {
    if (spec.test(line)) {
      const groups = spec.exec(line).groups;
      for (const key of ['row', 'col', 'newRow', 'newCol']) {
        if (groups[key] !== undefined) {
          groups[key] = Number(groups[key]);
        }
      }

      groups.type = type;

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
