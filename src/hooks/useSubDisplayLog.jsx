import { useEffect, useState } from 'react';

import { bufferize, bufferizeList } from '../utils';


export default function useSubDisplayLog(enabled, {
  log,
  topOffset=4,

  width, height, keyMap,
}) {
  const [buffers, setBuffers] = useState(null);
  const [scrollBuffer, setScrollBuffer] = useState(null);
  const [scrollSelectionBuffer, setScrollSelectionBuffer] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const [text, setText] = useState(null);
  const [textViewport, setTextViewport] = useState(null);
  const [textOffset, setTextOffset] = useState(0);

  const [logLength, setLogLength] = useState(log.length);

  useEffect(() => {
    setLogLength((length) => {
      setScrollOffset((offset) => offset + (log.length - length));
      return log.length;
    });
  }, [log.length]);

  useEffect(() => {
    if (!enabled === null || text) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setScrollOffset((offset) => (offset <= 0) ? 0 : offset - 1);
          break;
        case keyMap.down:
          setScrollOffset((offset) => (offset >= log.length - 1) ? offset : offset + 1);
          break;
        case keyMap.cancel:
          setScrollOffset(0);
          break;
        case keyMap.select:
          setScrollOffset((offset) => {
            setText(log[offset]);
            return offset;
          });
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, text]);

  useEffect(() => {
    if (!enabled === null || !textViewport) return;
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.up:
          setTextOffset((offset) => (offset <= 0) ? 0 : offset - 1);
          break;
        case keyMap.down:
          setTextOffset((offset) => (textViewport.length < height) ? offset : offset + 1);
          break;
        case keyMap.cancel:
          setTextOffset(0);
          setText(null);
          break;
      }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, textViewport, height]);

  useEffect(() => {
    if (!enabled) return;
    const list = log.map((msg, i) => `${log.length - i}. ${msg}`.padEnd(width, ' '));
    const buffer = bufferizeList(topOffset, [''].concat(list, ['']), width, height, scrollOffset);
    setScrollBuffer(buffer);
    setScrollSelectionBuffer(buffer.map(
      (line, i) => i === topOffset + 1 ? line : ''
    ));
  }, [enabled, log, scrollOffset, topOffset, height, width]);

  useEffect(() => {
    if (!text) {
      setTextViewport(null);
      return;
    }
    setTextViewport(bufferize(topOffset + 1, text, width, height, textOffset));
  }, [text, width, height, topOffset, textOffset]);

  useEffect(() => {
    if (!enabled) {
      setBuffers(null);
      return;
    }
    if (!textViewport) {
      setBuffers([
        scrollBuffer && { fg: '#555', buffer: scrollBuffer },
        scrollSelectionBuffer && { bg: '#555', fg: 'black', buffer: scrollSelectionBuffer },
      ].filter(Boolean));
    } else {
      setBuffers([
        { bg: '#888', fg: 'black', buffer: [
          '', '', '', '',
          `Entry ${log.length - scrollOffset}:`.padEnd(width, ' '),
        ]},
        { bg: '#c7c7c7', fg: '#c7c7c7', buffer: [
          '', '', '', '', '',
          ...(Array.from({ length: height - topOffset - 1 }, () => ' '.repeat(width))),
        ]},
        textViewport && { fg: 'black', buffer: textViewport},
      ].filter(Boolean));
    }
  }, [enabled, textViewport, scrollBuffer, height, width, scrollSelectionBuffer]);

  return buffers;
}