import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';

const optionKeys = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function MenuDisplay({
  width, height,
  target, activeChoice,
  options,
  magnification=1,
  locked=false,
  keyMap={
    down: 'j',
    up: 'k',
    pageDown: '=',
    pageUp: '-',
    use: 'Enter',
    cancel: 'Backspace',
  },
}) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(0);
  const [started, setStarted] = useState(null);

  const pageLength = height - 1;

  useEffect(() => {
    if (locked) return;

    const keydown = (e) => {
      if ([keyMap.down, keyMap.up].includes(e.key)) {
        setSelected((selected) => {
          const delta = (e.key === keyMap.down ? 1 : -1);
          const newSelected = (selected + delta) % options.length;
          if (newSelected < 0) {
            return options.length - 1;
          }
          return newSelected;
        });
      } else if ([keyMap.pageDown, keyMap.pageUp].includes(e.key)) {
        setPage((page) => {
          const maxPage = Math.ceil(options.length / pageLength);
          const delta = (e.key === '-' ? -1 : 1);
          const newPage = page + delta;
          if (newPage >= maxPage) return maxPage - 1;
          if (newPage < 0) return 0;
          return newPage;
        });
      } else {
        // numbers, shift+letters
        let i = optionKeys.indexOf(e.key.toUpperCase());
        if (e.shiftKey && (!isNaN(e.key) || i === -1)) {
          return;
        }
        if (i > -1 && i < options.length) {
          setSelected(i);
        }
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [locked, target]);

  useEffect(() => {
    const keydown = (e) => {
      if (e.key === keyMap.cancel) {
        setStarted(null);
      } else if (target && e.key === keyMap.use) {
        setStarted(selected);
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [target, selected]);

  useEffect(() => {
    if (!target) {
      setStarted(null);
    }

    setPage(Math.floor((started || selected) / pageLength));

    const event = new CustomEvent('menuChoice', {
      detail: target ? options[started] : null,
    });
    window.dispatchEvent(event);
  }, [started, target]);

  const prefixedOptions = options.map((option, i) => `${optionKeys[i]}:${option}`);
  const optionsViewport = prefixedOptions.slice(page * (height - 1), (page + 1) * (height - 1));

  const title = target ? `→${target.sprite} ${target.label}` : null;

  return (
    <ScreenStack
      gutter="#c7c7c7"
      defaultFg="black"
      width={width}
      height={height}
      magnification={magnification}
      hints={[
        `(${keyMap.up}/${keyMap.down}, `,
        `${keyMap.pageUp}/${keyMap.pageDown}, 1-9/0/A-Z) to navigate, `,
        `(${keyMap.use}) to use, `,
        `(${keyMap.cancel}) to end`,
      ].join('')}
      buffers={[
        { bg: 'black', fg: '#c7c7c7', buffer: [
          title || '(No target)',
          // if no active choice, we build a slim buffer for the highlighted
          // option prefix.
          ...(activeChoice ? [] : optionsViewport.map((option) => {
            const i = prefixedOptions.indexOf(option);
            return i === selected ? `${optionKeys[i]}:` : '';
          })),
        ]},
        activeChoice && (
          { bg: 'black', fg: '#c7c7c7', buffer: [
            '',
            `${optionKeys[options.indexOf(activeChoice)]}:${activeChoice}`,
          ]}
        ),
        !activeChoice && { fg: 'black', buffer: ['', ...optionsViewport.map((option) => {
          const i = prefixedOptions.indexOf(option);
          return i === selected ? `  ${option.split(':')[1]}` : option;
        })]},
      ].filter(b => !!b)}
    />
  );
}
