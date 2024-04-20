import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';

const optionKeys = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function MenuDisplay({ width, height, options, magnification=1 }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(0);

  const pageLength = height - 1;

  useEffect(() => {
    const keydown = (e) => {
      if (e.key === 'j' || e.key === 'k') {
        setSelected((selected) => {
          const delta = (e.key === 'j' ? 1 : -1);
          const newSelected = (selected + delta) % options.length;
          if (newSelected < 0) return options.length - 1;
          return newSelected;
        });
      } else if (e.key === '-' || e.key === '=') {
        setPage((e.key === '-' ? page - 1 : page + 1) % pageLength);
      } else {
        let i = optionKeys.indexOf(e.key.toUpperCase());
        if (e.shiftKey && (!isNaN(e.key) || i === -1)) {
          return;
        }
        if (i > -1 && i < options.length) setSelected(i);
        // if (i !== -1) setSelected(i % options.length);
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  useEffect(() => {
    setPage(Math.floor(selected / pageLength));
  }, [selected]);

  const prefixedOptions = options.map((option, i) => `${optionKeys[i]}:${option}`);
  const optionsViewport = prefixedOptions.slice(page * (height - 1), (page + 1) * (height - 1));

  return (
    <ScreenStack
      gutter="#c7c7c7"
      defaultFg="black"
      width={width}
      height={height}
      magnification={magnification}
      buffers={[
        { bg: 'black', fg: '#c7c7c7', buffer: [
          'Menu',
          ...optionsViewport.map((option) => {
            const i = prefixedOptions.indexOf(option);
            return i === selected ? `${optionKeys[i]}:` : '';
          }),
        ]},
        { fg: 'black', buffer: ['', ...optionsViewport.map((option) => {
          const i = prefixedOptions.indexOf(option);
          return i === selected ? `  ${option.split(':')[1]}` : option;
        })]},
      ]}
    />
  );
}
