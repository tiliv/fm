import { useState, useEffect } from 'react';

import useLocation from '../../hooks/useLocation';
import useInteraction from '../../hooks/useInteraction';
import ScreenStack from './ScreenStack';

const START_WORLD = 'Terra Montans.txt'
const START_Y = 17;
const START_X = 35;

const KEY_ALIASES = {
  ArrowDown: '↓',
  ArrowUp: '↑',
  ArrowLeft: '←',
  ArrowRight: '→',
}

export default function WorldDisplay({
  width, height,
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
    world: START_WORLD,
    x: START_X,
    y: START_Y,
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
    const event = new CustomEvent('interaction', { detail: interaction });
    window.dispatchEvent(event);
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
        `(${KEY_ALIASES[keyMap.up] || keyMap.up}`,
        `${KEY_ALIASES[keyMap.down] || keyMap.down}`,
        `${KEY_ALIASES[keyMap.left] || keyMap.left}`,
        `${KEY_ALIASES[keyMap.right] || keyMap.right})`,
        ' to move, bump into a target to select',
      ].join('')}
      magnification={magnification}
      buffers={buffers}
    />
  );
}
