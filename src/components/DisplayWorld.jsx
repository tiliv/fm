import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';
import useLocation from '../hooks/useLocation';
import useInteraction from '../hooks/useInteraction';
import useStats from '../hooks/useStats';
import useSave from '../hooks/useSave';
import { keyAlias, parseInteraction } from '../utils';

export default function DisplayWorld({
  target,

  inventory,

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

  const { name } = useStats();
  const { marker, layers, bump, local, position, interactions } = useLocation({
    world: startWorld,
    x: startX,
    y: startY,
    w: width,
    h: height,
    keyMap,
  });
  const { interaction, interactionBuffer } = useInteraction({
    bump,
    interactions,
    x: position.x,
    y: position.y,
    w: width,
    h: height,
  });

  // Try to hydrate a bumped 'interaction' with a corresponding dataFile.
  useEffect(() => {
    if (!interaction) {
      const event = new CustomEvent('interaction', { detail: null });
      window.dispatchEvent(event);
    } else {
      const { label, dataFile } = interaction;
      if (!label || !dataFile) {
        const event = new CustomEvent('interaction', { detail: interaction });
        window.dispatchEvent(event);
        return;
      };
      fetch(`interactions/${label}/${dataFile}`)
        .then((res) => res.text())
        .catch((err) => `Look:\n${err}`)
        .then((text) => parseInteraction(interaction, text, { name }))
        .then((newInteraction) => {
          const event = new CustomEvent('interaction', { detail: newInteraction });
          window.dispatchEvent(event);
        });
    }
  }, [interaction, name]);

  // Build the full-screen opacity buffer and copy over player & target sprites.
  useEffect(() => {
    if (!target) {
      setActiveBuffer(null);
      return;
    }
    const buffer = Array.from({ length: height }, () => Array.from({ length: width }, () => ' '));
    const [r, c] = target.coordinates;
    buffer[local.y][local.x] = marker;
    buffer[(r - 1) % height][(c - 1) % width] = target.sprite;
    setActiveBuffer(buffer);
  }, [target, width, height]);

  const buffers = [
    { fg: '#555', buffer: layers.solid },
    { fg: '#888', buffer: layers.passable },
    { fg: '#f50', buffer: interactionBuffer },
    { fg: '#000', buffer: layers.objects },
    activeBuffer && { bg: '#ccc7', fg: '#000', buffer: activeBuffer },
  ].filter(Boolean);

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
