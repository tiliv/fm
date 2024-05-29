import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';
import useLocation from '../hooks/useLocation';
import useInteraction from '../hooks/useInteraction';
import useSave from '../hooks/useSave';
import { keyAlias } from '../utils';
import { TYPES } from '../interactions';

export default function DisplayWorld({
  target,
  battle,

  possesses,

  width, height,
  startWorld, startX, startY,
  magnification=1,
  keyMap={
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
  },
}) {
  const [activeBuffer, setActiveBuffer] = useState(null);
  const [zoneBuffer, setZoneBuffer] = useState(null);
  const [animation, setAnimation] = useState(0);
  const [buffers, setBuffers] = useState([]);

  // This is redundant to the outer App.jsx useSave, because that one fails a
  // race condition to save data before it's unmounted and re-mounted. This one
  // saves data fine, but won't load anything, as the setters are no-op.
  useSave({
    magnification: [magnification, () => {}],
    width: [width, () => {}],
    height: [height, () => {}],
    startWorld: [startWorld, () => {}],
    startX: [startX, () => {}],
    startY: [startY, () => {}],
  });

  const {
    marker, size, walls, layers, bump, zone, local, origin, position, interactions,
  } = useLocation({
    world: startWorld, x: startX, y: startY, width, height,
    possesses,
    keyMap,
  });
  const { interaction, interactionBuffer } = useInteraction({
    bump,
    walls, layers, interactions,
    x: position.x, y: position.y, w: width, h: height,
  });

  // Start interaction event
  useEffect(() => {
    const event = new CustomEvent('interaction', { detail: interaction });
    window.dispatchEvent(event);
  }, [interaction]);

  // Animation counter
  useEffect(() => {
    const interval = setInterval(() => setAnimation(a => a + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Build the zone overlay, if applicable
  useEffect(() => {
    if (!zone) {
      setZoneBuffer(null);
      return;
    }
    const { box, buffer, maxWidth, directions, attributes: { fg='f00', bg=null }={} } = zone;
    const [startY, startX] = [box[0] - origin.y - 1, box[1] - origin.x - 1];

    // `animation` counts across each frame then repeats, but we want to total
    // up all prior frames as well.
    let offset = [0, 0];
    if (directions) {
      const loops = Math.floor(animation / directions.length);
      const frames = directions.slice(0, (animation % directions.length) + 1);
      const priorOffset = directions
        .map(([dy, dx]) => [dy * loops, dx * loops])
        .reduce(([y, x], [dy, dx]) => [y + dy, x + dx], [0, 0])
        ;
      offset = frames.reduce(([y, x], [dy, dx]) => [y + dy, x + dx], priorOffset);
    }

    const rendered = Array.from(
      { length: height },
      (_, y) => Array.from({ length: width }, (_, x) => {
        const [r, c] = [y + origin.y + 1, x + origin.x + 1];
        if (r < box[0] || r > box[2] || c < box[1] || c > box[3]) return '';
        const br = ((y - startY + offset[0]) % size[0] + size[0]) % size[0];
        const bc = ((x - startX + offset[1]) % size[1] + size[1]) % size[1];
        const row = buffer[br % buffer.length];
        return row[bc % maxWidth] || ' ';
      })
    );
    setZoneBuffer({
      bg: bg ? `#${bg}` : null,
      fg: `#${fg}`,
      buffer: rendered,
    });
  }, [zone, origin, size, animation]);

  // Find responders to ambient events
  useEffect(() => {
    const ambientHandler = ({ detail: { name }}) => {
      Object.entries(interactions)
        .filter(([, { type, [name]: data }]) => type === TYPES.NPC && data)
        .forEach(([, interaction]) => {
          const event = new CustomEvent('interaction', {
            detail: { ...interaction, start: name },
          });
          window.dispatchEvent(event);
        });
    };
    window.addEventListener('Ambient', ambientHandler);
    return () => window.removeEventListener('Ambient', ambientHandler);
  }, [interactions]);

  // Build the full-screen opacity buffer and copy over player & target sprites.
  useEffect(() => {
    if (!target || target.incidental) {
      setActiveBuffer(null);
      return;
    }
    const buffer = Array.from({ length: height }, () => Array.from({ length: width }, () => ' '));
    const [r, c] = target.coordinates;
    buffer[local.y][local.x] = marker;
    buffer[(r - 1) % height][(c - 1) % width] = target.sprite;
    setActiveBuffer(buffer);
  }, [target, width, height]);

  useEffect(() => {
    const buffers = [];

    if (battle) {
      const spacers = Array.from({ length: parseInt(height / 2) }, () => Array.from({ length: width }, () => ' '));
      const strips = [
        (layers.foreground || []).join(''),
        (layers.background1 || []).join(''),
        (layers.background2 || []).join(''),
      ];
      const y = position.y + 1;
      const prefix = `^(${y}|${y-1}|${y-2}),`;
      const see = Object.entries(interactions).filter(([k]) => k.match(prefix));
      see.forEach(([coord, data]) => {
        const [r, c] = coord.split(',').map(Number);
        const x = (c - 1) % width;
        const layer = Math.abs(r - position.y - 1);
        strips[layer] = strips[layer].slice(0, x) + data.sprite + strips[layer].slice(x + 1);
      });
      buffers.push(
        { fg: '#5553', buffer: [...spacers, strips[2]] },
        { fg: '#5558', buffer: [...spacers, strips[1]] },
        { fg: '#555', buffer: [...spacers, strips[0]] },
        { fg: '#000', buffer: [...spacers, ' '.repeat(local.x) + marker] },
      );
    } else {
      buffers.push(...[
        { fg: '#555', buffer: layers.solid },
        { fg: '#888', buffer: layers.passable },
        { fg: '#f50', buffer: interactionBuffer },
        { fg: '#000', buffer: layers.objects },
        { fg: '#000', buffer: [
          ...Array.from({ length: local.y }, () => ''),
          ' '.repeat(local.x) + marker,
        ]},
        activeBuffer && { bg: '#ccc7', fg: '#000', buffer: activeBuffer },
        zoneBuffer,
      ].filter(Boolean));
    }

    setBuffers(buffers);
  }, [
    battle, local, layers.solid, layers.passable, layers.objects,
    interactionBuffer, activeBuffer, zoneBuffer,
  ]);

  return (
    <ScreenStack
      gutter="#c7c7c7"
      defaultFg="black"
      width={width}
      height={height}
      hints={[
        `(${keyAlias(keyMap.up)}`,
        `${keyAlias(keyMap.down)}`,
        `${keyAlias(keyMap.left)}`,
        `${keyAlias(keyMap.right)})`,
        ' to move, bump into a target to select',
      ].join('')}
      magnification={magnification}
      buffers={buffers}
    />
  );
}
