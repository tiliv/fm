import { useState, useEffect } from 'react';

import ScreenStack from './ScreenStack';
import useSave from '../hooks/useSave';
import { ACTIONS_ORDER } from '../Actions';
import { minifyNumbers, bufferize } from '../utils';

const OPTION_KEYS = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function DisplayMenu({
  target,

  width, height, magnification=1,
  keyMap={
    down: 'j',
    up: 'k',
    pageDown: '=',
    pageUp: '-',
    use: 'Enter',
    cancel: 'Backspace',
  },
}) {

  const [menus, setMenus] = useState([]);
  const [options, setOptions] = useState(null);
  const [optionsViewport, setOptionsViewport] = useState(null);
  const [text, setText] = useState(null);
  const [textViewport, setTextViewport] = useState(null);
  const [selected, setSelected] = useState(0);

  const _viewportHeight = height - menus.length;
  const _page = Math.floor(selected / _viewportHeight);
  const _offset = _page * _viewportHeight;

  // Set fresh menu on target change
  useEffect(() => {
    if (!target) {
      setSelected(0);
      setOptionsViewport(null);
      setTextViewport(null);
      setMenus([]);
      return;
    }

    // const items = ACTIONS_ORDER.filter((option) => target[option]);
    const items = Object.entries(target)
      .filter(([k]) => ACTIONS_ORDER.includes(k))
      .sort(([k1], [k2]) => ACTIONS_ORDER.indexOf(k1) - ACTIONS_ORDER.indexOf(k2))
      ;
    items.push(...Object.entries(target).filter(([k]) => {
      if (items.find(([k2]) => k2 === k)) return false;
      return /^[A-Z]$/.test(k[0]);
    }));

    setMenus([{
      title: `→${target.sprite} ${target.label}`,
      items: items.map(([_, v]) => v),
    }])
  }, [`${target?.coordinates}`]);  // fixme: target 'updates' when player inventory changes

  // Set options to current menu
  useEffect(() => {
    const { items=null, text=null } = menus[menus.length - 1] || {};
    setOptions(items);
    setText(text);
  }, [menus.length, menus[0], width, _viewportHeight]);

  // Set optionsViewport to current menu page
  useEffect(() => {
    if (!options) {
      setOptionsViewport(null);
      return;
    }
    setOptionsViewport(options.slice(_offset, _offset + _viewportHeight));
  }, [options, _viewportHeight, _offset]);

  // Set textViewport to current menu text at offset
  useEffect(() => {
    if (!text) {
      setTextViewport(null);
      return;
    }
    setTextViewport(bufferize(menus.length, text, width, height, selected));
  }, [menus.length, text, width, height, selected]);

  // Key handler for cancel
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === keyMap.cancel) {
        setMenus((menus) => {
          if (menus.length > 1) {
            const newMenus = menus.slice(0, -1);
            setSelected(newMenus[newMenus.length - 1].selected);
            return newMenus;
          }
          return menus;
        });
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, []);

  // Key handler for current menu
  useEffect(() => {
    if (!options) {
      return;
    }
    const keyHandler = (e) => {
      switch (e.key) {
        case keyMap.down:
          setSelected((selected) => (selected + 1) % options.length);
          break;
        case keyMap.up:
          setSelected((selected) => (selected - 1 + options.length) % options.length);
          break;
        case keyMap.pageDown:
          setSelected((selected) => Math.min(options.length - 1, selected + _viewportHeight));
          break;
        case keyMap.pageUp:
          setSelected((selected) => Math.max(0, selected - _viewportHeight));
          break;
        case keyMap.use:
          setSelected((selected) => {
            const option = options[selected];
            if (option.event) {
              const _selected = isNaN(menus[0].selected) ? selected : menus[0].selected;
              const topOption = menus[0].items[_selected];
              const eventNames = { Load: 'load' };
              const event = new CustomEvent(
                eventNames[topOption.name] || topOption.name,
                { detail: option }
              );
              setTimeout((event) => window.dispatchEvent(event), 0, event);

              // Bail now if nothing to display
              // (I don't think this is in use yet)
              if (!option.items && !option.text) {
                return selected;
              }
            }
            setMenus((menus) => {
              menus[menus.length - 1].selected = selected;
              return [...menus, {
                title: `${OPTION_KEYS[selected]}:${option.name}`,
                items: option.items,
                text: option.text,
              }];
            });
            return 0;
          });
        default:
          if (e.key.length === 1) {
            const number = !isNaN(e.key);
            const letter = /^[A-Z]$/.test(e.key);
            if (number || (e.shiftKey && letter)) {
              const index = OPTION_KEYS.indexOf(e.key);
              if (index >= 0 && index < options.length) {
                setSelected(index);
              }
            }
          }
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [options, width, _viewportHeight]);

  // Key handler for text viewport
  useEffect(() => {
    if (!textViewport) {
      return;
    }
    const keyHandler = (e) => {
      let delta = 0;
      switch (e.key) {
        case keyMap.down: delta = 1; break;
        case keyMap.up: delta = -1; break;
        case keyMap.pageDown: delta = _viewportHeight; break;
        case keyMap.pageUp: delta = -_viewportHeight; break;
        default: return;
      }
      setSelected((selected) => {
        const offset = selected + delta
        if (offset < 0) return 0;
        if (delta > 0 && textViewport.length < height) return selected;
        return offset;
      });
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [textViewport, width, _viewportHeight]);

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
        { bg: 'black', fg: '#c7c7c7', buffer: menus.map((menu) => menu.title) },
        (menus.length && optionsViewport) && { bg: '#c7c7c7', fg: 'black', buffer: [
          ...(' '.repeat(menus.length - 1).split(' ')),
          ...optionsViewport.map(
            (option, i) => `${OPTION_KEYS[_offset + i]}:${option.name}`
          ),
        ]},
        (menus.length && optionsViewport) && { bg: 'black', fg: '#c7c7c7', buffer: [
          ...(' '.repeat(menus.length - 1).split(' ')),
          ...optionsViewport.map(
            (_, i) => selected === _offset + i ? `${OPTION_KEYS[_offset + i]}:` : ''
          ),
        ]},
        (menus.length && textViewport) && { fg: 'black', buffer: textViewport}
      ].filter(Boolean)}
    />
  );
}
