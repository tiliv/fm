import { useState, useEffect } from 'react';

function inViewport(y, x, bump, h, w) {
  const [by, bx] = bump;
  return (
    by >= 0 && bx >= 0
    && parseInt(by / h) === parseInt(y / h)
    && parseInt(bx / w) === parseInt(x / w)
  );
}

export default function useInteraction({
  x, y, w, h,
  bump, interactions,
  marker='▒', emptyMarker='⬚',
  invisibleMarker='ˣ',  // this glyph is mapped to a blank character in the font
}) {
  const [interaction, setInteraction] = useState(null);
  const [interactionBuffer, setInteractionBuffer] = useState([[]]);

  useEffect(() => {
    const buffer = Array.from({ length: h }, () => invisibleMarker.repeat(w).split(''));
    let foundInteraction = null;
    if (bump) {
      const [by, bx] = bump;
      const lbx = bx % w;
      const lby = by % h;

      if (inViewport(y, x, bump, h, w)) {
        let interaction = interactions[`${by + 1},${bx + 1}`];
        buffer[lby][lbx] = interaction ? marker : emptyMarker;
        if (interaction) {
          foundInteraction = interaction;
        } else {
          // Reach one space farther to see if something is on the other side.
          const xDiff = bx - x;
          const yDiff = by - y;
          if (inViewport(y, x, [by + yDiff, bx + xDiff], h, w)) {
            interaction = interactions[`${by + yDiff + 1},${bx + xDiff + 1}`];
            if (interaction) {
              foundInteraction = interaction;
              buffer[lby + yDiff][lbx + xDiff] = marker;
            }
          }
        }
      }
    }
    setInteraction(foundInteraction);
    setInteractionBuffer(buffer);
  }, [bump]);

  return {
    interaction,
    interactionBuffer,
  };
}
