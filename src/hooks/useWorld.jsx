import { useState, useEffect } from 'react';

import { classifyObjectSpec } from '../interactions';

export default function useWorld({ world }) {
  const [walls, setWalls] = useState({});
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [map, setMap] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [zones, setZones] = useState({});

  useEffect(() => {
    fetch(`world/${world}`)
      .then((res) => res.text())
      .then((text) => {
        const [loadedMap, zoneKey, objects] = text.trim().split('---\n');
        const rows = loadedMap.trim().split('\n');
        setMap(rows.map((row) => row.split('')));
        setSize({ width: rows[0].length, height: rows.length });
        setWalls(Object.fromEntries((zoneKey || '').split('\n').map((line) => line.trim().split(':'))));

        const lines = (objects || '').split('\n').map((line) => {
          if (!line.length) return false;
          try {
            return classifyObjectSpec(line);
          } catch (e) {
            console.error(e);
            return false;
          }
        }).filter(Boolean);

        const points = lines.filter((data) => data.coordinates);
        const boxGroups = lines.filter((data) => data.boxes);
        setInteractions(Object.fromEntries(
          points.map((data) => {
            const { coordinates: [r, c] } = data;
            data.sprite = rows[r - 1][c - 1];
            return [`${r},${c}`, data];
          }
        )));

        return boxGroups;
      }).then(async (boxGroups) => {
        const zones = [];
        await Promise.all(boxGroups.map(async (data) => {
          const { boxes, dataFile } = data;
          const overlay = await fetch(`overlays/${dataFile}`).then((res) => res.text());
          data.buffer = overlay.trim().split('\n');
          boxes.forEach((box) => {
            zones.push([`${box}`, { ...data, box }]);
          });
        }));
        const zoneInteractions = Object.fromEntries(zones);
        setZones(zoneInteractions);
      });
  }, [world]);

  return { map, size, walls, interactions, zones };
}
