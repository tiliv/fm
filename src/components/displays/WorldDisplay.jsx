import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';
import useLocation from '../../hooks/useLocation';
import useInteraction from '../../hooks/useInteraction';
import { ACTIONS } from '../../Actions';
import * as Buy from '../../actions/Buy';
import { renderTemplate, keyAlias } from '../../utils';

export default function WorldDisplay({
  width, height,
  startWorld, startX=0, startY=0,
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
            actions[category] = renderTemplate(item, { name: "Hero" }).slice(category.length + 1).trim();
          });
          actions[ACTIONS.BUY] = Buy.parse(actions);
          return actions;
        })
        .then((actions) => {
          const event = new CustomEvent('interaction', { detail: actions });
          window.dispatchEvent(event);
        })
    }
  }, [interaction]);

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
  }, [target]);

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
