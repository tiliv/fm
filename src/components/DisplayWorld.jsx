import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';
import useLocation from '../hooks/useLocation';
import useInteraction from '../hooks/useInteraction';
import useStats from '../hooks/useStats';
import useSave from '../hooks/useSave';
import { list } from '../actions/Load';
import { ACTIONS } from '../Actions';
import { renderTemplate, keyAlias, parseInventory } from '../utils';

export default function DisplayWorld({
  width, height,
  startWorld, startX, startY,
  target,
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
      fetch(`${label}/${dataFile}`)
        .catch((err) => `Look:\n${err}`)
        .then((res) => res.text())
        .then((text) => {
          const items = text.split('---');
          const actions = {...interaction};
          items.forEach((item) => {
            const [category] = item.trim().split('\n', 1);
            actions[category] = renderTemplate(item, { name }).slice(category.length + 1).trim();
          });
          const inventory = parseInventory(actions);
          if (inventory.length > 0) {
            actions[ACTIONS.BUY] = inventory;
          }
          if (actions.Load !== undefined) {
            actions["Load"] = list().map((name) => ({ name }));
          }
          return actions;
        })
        .then((actions) => {
          const event = new CustomEvent('interaction', { detail: actions });
          window.dispatchEvent(event);
        })
    }
  }, [interaction, name]);

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
  ].filter(b => !!b);

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
