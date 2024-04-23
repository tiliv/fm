import { useState, useEffect } from 'react';

export default function useWorld({ world }) {
  const [walls, setWalls] = useState([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [map, setMap] = useState([]);
  const [interactions, setInteractions] = useState({});

  useEffect(() => {
    fetch(`/world/${world}`)
      .then((res) => res.text())
      .then((text) => {
        const [loadedMap, zoneKey, objects] = text.trim().split('---\n');
        const rows = loadedMap.trim().split('\n');
        setMap(rows.map((row) => row.split('')));
        setSize({ width: rows[0].length, height: rows.length });
        setWalls((zoneKey || '').split('\n').map((line) => line[0]));
        setInteractions(Object.fromEntries(
          (objects || '').split('\n').filter(line => line.length).map((line) => {
            const data = classifyObjectSpec(line);
            const [r, c] = data.coordinates;
            data.sprite = rows[r - 1][c - 1];
            return [`${r},${c}`, data];
          })
        ));
      });
  }, [world]);

  return { map, size, walls, interactions };
}

const RowCol = "(?<row>\\d+),(?<col>\\d+)";
const NewRowCol = "(?<newRow>\\d+),(?<newCol>\\d+)";
const Label = "(?<label>[^/#]+)";
const DataFile = "(?<dataFile>\\w+\\.txt)";
const OptionalInventory = "(?<inventory>(,\\$[^,]+)*)";
const OptionalAttributes = "(?<attributes>(#[^=]+=[^#]+)*)";

const WORLD_SPEC = RegExp(`^${RowCol}=${NewRowCol}:${Label}/${DataFile}$`);
const DOOR_SPEC  = RegExp(`^${RowCol}=${NewRowCol}:${Label}${OptionalAttributes}$`);
const NPC_SPEC   = RegExp(`^${RowCol}:${Label}/${DataFile}${OptionalInventory}$`);
const OBJ_SPEC   = RegExp(`^${RowCol}:${Label}$`);

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
