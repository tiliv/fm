import { useState, useEffect } from 'react';

export default function useInteraction({ x, y, w, h, bump, interactions }) {
  const [interaction, setInteraction] = useState(null);
  const [interactionBuffer, setInteractionBuffer] = useState([[]]);

  useEffect(() => {
    const buffer = Array.from({ length: h }, () => 'ˣ'.repeat(w).split(''));
    if (bump) {
      const [by, bx] = bump;

      // fixme: shouldn't wrap on the current screen, should check next screen
      const lbx = bx % w;
      const lby = by % h;

      let interaction = interactions[`${by + 1},${bx + 1}`];
      buffer[lby][lbx] = interaction ? '▒' : '⬚';
      if (!interaction) {
        const xDiff = lbx - x;
        const yDiff = lby - y;
        interaction = interactions[`${by + yDiff + 1},${bx + xDiff + 1}`];
        if (interaction) {
          buffer[lby + yDiff][lbx + xDiff] = '▒';
          setInteraction(interaction);
        } else {
          setInteraction(null);
        }
      } else {
        setInteraction(interaction);
      }
    } else {
      setInteraction(null);
    }
    setInteractionBuffer(buffer);
  }, [bump]);

  return {
    interaction,
    interactionBuffer,
  };
}
