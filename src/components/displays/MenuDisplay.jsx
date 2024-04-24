import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';
import { ACTIONS } from '../../Actions';
import useSave from '../../hooks/useSave';
import { minifyNumbers, bufferize } from '../../utils';

const OPTION_KEYS = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SUB_MENU_CHOICES = [ACTIONS.BUY, "Load"];

export default function MenuDisplay({
  saveSlot,
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

  const [subOptions, setSubOptions] = useState(null);
  const [subSelected, setSubSelected] = useState(null);

  useSave(saveSlot, {
    selected: [selected, setSelected],
    page: [page, setPage],
  });

  useEffect(() => {
    if (activeChoice === "Save") {
      const event = new CustomEvent("Save");
      window.dispatchEvent(event);
    }
  }, [activeChoice]);

  useEffect(() => {
    // console.log("Active choice", activeChoice, targetData);
    if (!targetData || !SUB_MENU_CHOICES.includes(activeChoice)) {
      setSubOptions(null);
      return;
    }
    setSubOptions(targetData[activeChoice]);
    setSubSelected(0);
  }, [activeChoice, targetData]);

  useEffect(() => {
    if (
      started === null
      || !targetData?.[activeChoice]
      || typeof targetData[activeChoice] !== 'string'
      || targetData[activeChoice].length === 0
    ) {
      setScrollOffset(0);
      setScrollBuffer(null);
      return;
    }
    setScrollBuffer(bufferize(2, targetData[activeChoice], width, height, scrollOffset));
  }, [started, targetData, scrollOffset]);

  useEffect(() => {
    const keydown = (e) => {
      if ([keyMap.down, keyMap.up].includes(e.key)) {
        const delta = (e.key === keyMap.down ? 1 : -1);

        if (subOptions) {
          setSubSelected((subSelected) => {
            const newSelected = (subSelected + delta) % subOptions.length;
            if (newSelected < 0) {
              return subOptions.length - 1;
            }
            return newSelected;
          });
        } else if (scrollBuffer === null && !activeChoice) {
          setSelected((selected) => {
            const newSelected = (selected + delta) % options.length;
            if (newSelected < 0) {
              return options.length - 1;
            }
            return newSelected;
          });
        } else {
          setScrollOffset((scrollOffset) => {
            const newOffset = scrollOffset + delta;
            if (newOffset < 0) return 0;
            if (delta > 0 && (scrollBuffer || '').length < height) return scrollOffset;
            return newOffset;
          });
        }
      } else if ([keyMap.pageDown, keyMap.pageUp].includes(e.key)) {
        if (scrollBuffer === null && !activeChoice) {
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
            if (delta > 0 && (scrollBuffer || '').length < height) return scrollOffset;
            return newOffset;
          });
        }
      } else {
        if (scrollBuffer === null) {
          // numbers, shift+letters
          let i = OPTION_KEYS.indexOf(e.key.toUpperCase());
          if (e.shiftKey && (!isNaN(e.key) || i === -1)) {
            return;
          }
          if (i > -1 && i < (subOptions || options).length) {
            if (subOptions) {
              setSubSelected(i);
            } else {
              setSelected(i);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [target, targetData, scrollBuffer, activeChoice, options, subOptions]);

  useEffect(() => {
    const keydown = (e) => {
      if (e.key === keyMap.cancel) {
        setStarted(null);
        setScrollOffset(0);
        setScrollBuffer(null);
      } else if (!subOptions && target && e.key === keyMap.use) {
        setStarted(selected);
      } else if (subOptions && e.key === keyMap.use) {
        // throw event for sub menu choice
        const event = new CustomEvent(activeChoice, {
          detail: subOptions[subSelected],
        });
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [target, selected, subSelected, subOptions, activeChoice]);

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
  const prefixedOptions = options.map((option, i) => `${OPTION_KEYS[i]}:${option}`);
  const optionsViewport = prefixedOptions.slice(page * (height - 1), (page + 1) * (height - 1));
  const prefixedSubOptions = subOptions && subOptions.map((option, i) => `${OPTION_KEYS[i]}:${option.name}`);
  const subOptionsViewport = subOptions && prefixedSubOptions.slice(0, height - 2);

  return (
    <ScreenStack
      gutter="#c7c7c7"
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
            return i === selected ? `${OPTION_KEYS[i]}:` : '';
          })),
        ]},

        // Sub menu highlight
        (subOptions && { bg: 'black', fg: '#c7c7c7', buffer: [
          '',
          '',
          ...subOptionsViewport.map((option) => {
            const i = prefixedSubOptions.indexOf(option);
            return i === subSelected ? `${OPTION_KEYS[i]}:` : '';
          }),
        ]}),

        // Active selection during sub display
        activeChoice && (
          { bg: 'black', fg: '#c7c7c7', buffer: [
            '',
            `${OPTION_KEYS[options.indexOf(activeChoice)]}:${activeChoice}`,
          ]}
        ),
        // Main menu content
        !activeChoice && (
          { fg: 'black', buffer: ['', ...optionsViewport.map((option) => {
            const i = prefixedOptions.indexOf(option);
            return i === selected ? `  ${option.split(':')[1]}` : option;
          })]}
        ),
        // Active sub content
        (activeChoice && scrollBuffer) && { fg: 'black', buffer: scrollBuffer},
        (activeChoice && subOptionsViewport) && (
          { fg: 'black', buffer: [
            '', '',
            ...subOptionsViewport.map((option, i) => {
              const spec = subOptions[i];
              let label = option.padEnd(width, ' ');
              if (i === subSelected){
                label = `  ${label.split(':')[1]}`;
              }
              if (spec.stats === undefined) {
                return label;
              }
              return label.slice(0, -1) + minifyNumbers(spec.stats?.A || spec.stats?.D || 0)
            }),
          ]}
        ),
      ].filter(b => !!b)}
    />
  );
}
