import Screen, { FONT_WIDTH, FONT_HEIGHT } from './Screen';

export default function ScreenStack({ width, height, defaultBg, defaultFg, magnification, gutter, buffers}) {
  const charWidth = FONT_WIDTH * magnification;
  const charHeight = FONT_HEIGHT * magnification;
  const w = width * charWidth;
  const h = height * charHeight;

  return (
    <div style={{backgroundColor: gutter, width: w, height: h}}>
      {buffers.map(({ bg=defaultBg, fg=defaultFg, buffer }, i) => (
        <Screen
          key={i}
          width={width}
          height={height}
          bg={bg}
          fg={fg}
          buffer={buffer}
          magnification={magnification}
        />
      ))}
    </div>
  );
}
