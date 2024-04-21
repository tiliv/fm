import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';

const optionKeys = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function bufferize(topMargin, text, width, height, scrollOffset) {
  const buffer = [];
  const words = text.split(' ');
  let currentLine = [];

  words.forEach(word => {
    if (currentLine.join(' ').length + word.length + 1 > width) {
      buffer.push(currentLine);
      currentLine = [];
    }
    currentLine.push(word);
  });

  if (currentLine.length > 0) {
    buffer.push(currentLine);
  }

  const scrolledBuffer = buffer
    .slice(scrollOffset, scrollOffset + height - topMargin)
    .map(line => line.join(' '));
  scrolledBuffer.unshift(...Array(topMargin).fill(''));
  return scrolledBuffer;
}

export default function MenuDisplay({
  width, height,
  target, targetData, activeChoice,
  options,
  magnification=1,
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
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollBuffer, setScrollBuffer] = useState(null);

  const pageLength = height - 1;

  useEffect(() => {
    if (started === null || !activeChoice || !targetData) {
      setScrollOffset(0);
      setScrollBuffer(null);
      return;
    }
    setScrollBuffer(bufferize(2, targetData[activeChoice], width, height, scrollOffset));
  }, [started, targetData, scrollOffset]);

  useEffect(() => {
    const keydown = (e) => {
      if ([keyMap.down, keyMap.up].includes(e.key)) {
        if (scrollBuffer === null) {
          setSelected((selected) => {
            const delta = (e.key === keyMap.down ? 1 : -1);
            const newSelected = (selected + delta) % options.length;
            if (newSelected < 0) {
              return options.length - 1;
            }
            return newSelected;
          });
        } else {
          setScrollOffset((scrollOffset) => {
            const delta = (e.key === keyMap.down ? 1 : -1);
            const newOffset = scrollOffset + delta;
            if (newOffset < 0) return 0;
            if (delta > 0 && scrollBuffer.length < height) return scrollOffset;
            return newOffset;
          });
        }
      } else if ([keyMap.pageDown, keyMap.pageUp].includes(e.key)) {
        if (scrollBuffer === null) {
          setPage((page) => {
            const maxPage = Math.ceil(options.length / pageLength);
            const delta = (e.key === '-' ? -1 : 1);
            const newPage = page + delta;
            if (newPage >= maxPage) return maxPage - 1;
            if (newPage < 0) return 0;
            return newPage;
          });
        } else {
          setScrollOffset((scrollOffset) => {
            const delta = (e.key === keyMap.pageDown ? 1 : -1) * (height - 2);
            const newOffset = scrollOffset + delta;
            if (newOffset < 0) return 0;
            if (delta > 0 && scrollBuffer.length < height) return scrollOffset;
            return newOffset;
          });
        }
      } else {
        if (scrollBuffer === null) {
          // numbers, shift+letters
          let i = optionKeys.indexOf(e.key.toUpperCase());
          if (e.shiftKey && (!isNaN(e.key) || i === -1)) {
            return;
          }
          if (i > -1 && i < options.length) {
            setSelected(i);
          }
        }
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [target, targetData, scrollBuffer]);

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
  }, [target, started]);

  const title = target ? `→${target.sprite} ${target.label}` : null;
  const prefixedOptions = options.map((option, i) => `${optionKeys[i]}:${option}`);
  const optionsViewport = prefixedOptions.slice(page * (height - 1), (page + 1) * (height - 1));

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
        // Title stuff locked up top
        { bg: 'black', fg: '#c7c7c7', buffer: [
          title || '(No target)',
          // if no active choice, build a minimal buffer for just the highlighted option prefix
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

        // Content
        !activeChoice && (
          { fg: 'black', buffer: ['', ...optionsViewport.map((option) => {
            const i = prefixedOptions.indexOf(option);
            return i === selected ? `  ${option.split(':')[1]}` : option;
          })]}
        ),
        (activeChoice && scrollBuffer) && { fg: 'black', buffer: scrollBuffer},
      ].filter(b => !!b)}
    />
  );
}
