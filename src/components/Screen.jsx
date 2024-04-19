import './Screen.css';

export const FONT_WIDTH = 12;
export const FONT_HEIGHT = 20;
export const BLANK = ['ˣ', '', null, undefined];

export default function Screen({ width, height, bg, fg, buffer, magnification=1 }) {
  return (
    <div className="screen">
      {Array.from({ length: height }, (_, y) => (
        <div key={y} className="screen-row" style={{
          width: FONT_WIDTH * magnification * width,
          height: FONT_HEIGHT * magnification
        }}>
          {Array.from({ length: width }, (_, x) => (
            <span className="screen-char" key={x} style={{
              width: FONT_WIDTH,
              height: FONT_HEIGHT,
              zoom: magnification,
              // borderColor: buffer[y]?.[x] ? fg : 'transparent',
              backgroundColor: !BLANK.includes(buffer[y]?.[x]) ? bg : 'transparent',
              color: buffer[y]?.[x] ? fg : 'transparent',
            }}>{buffer[y]?.[x] || '&nbsp;'}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
