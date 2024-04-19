import { useState, useEffect } from 'react';

export default function useInteraction({ x, y, w, h, facing, interactions }) {
  const [enabled, setEnabled] = useState(false);

  const interactionBuffer = Array.from({ length: h }, () => 'ˣ'.repeat(w).split(''));
  if (enabled) {
    if (facing[0]) {
      interactionBuffer[y + facing[0]][x] = '▒';
      interactionBuffer[y + facing[0] * 2][x] = '▒';
    }
    if (facing[1]) {
      interactionBuffer[y][x + facing[1]] = '▒';
      interactionBuffer[y][x + facing[1] * 2] = '▒';
    }
  }

  useEffect(() => {
    const keydown = (e) => {
      switch (e.key) {
        case ' ':
          setEnabled((enabled) => !enabled);
          break;
        case 'Enter':
          // check if any interactions keys are in the facing direction
          const [dy, dx] = facing;
          for (const [location, label] of Object.entries(interactions)) {
            let [ly, lx] = location.split(',').map(Number);
            if (interactionBuffer[(ly - 1) % h][(lx - 1) % w] === '▒') {
              console.log(label);
              break;
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [x, y]);

  return {
    interactionBuffer,
  };
}
