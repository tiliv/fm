import { useEffect, useState } from 'react';

import ScreenStack from './ScreenStack';
import useStats from '../hooks/useStats';
import useEquipmentBuffers from '../hooks/useEquipmentBuffers';
import { keyAlias, minifyNumbers } from '../utils';

const TABS = ['Equip', 'Magic', 'Log']


export default function DisplayStats({
  width, height, magnification=1,
  keyMap={
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    select: ' ',
    cancel: 'Escape',
  },
}) {
  const { name, hp, maxHp, gold, strength, defense, speed } = useStats();
  const [menuChoice, setMenuChoice] = useState(0);

  // Change horizontal menu category
  useEffect(() => {
    const keydown = (e) => {
      switch (e.key) {
        case keyMap.left: setMenuChoice((choice) => (choice + TABS.length - 1) % TABS.length); break;
        case keyMap.right: setMenuChoice((choice) => (choice + 1) % TABS.length); break;
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);

  const equipmentBuffers = useEquipmentBuffers(menuChoice === 0, { width, height, keyMap });
  const magicBuffers = [{ fg: 'red', buffer: ['', '', '', '', TABS[1]]}];
  const logBuffers = [{ fg: 'green', buffer: ['', '', '', '', TABS[2]]}];
  const lowerBuffers = [
    ...(equipmentBuffers || []),
    ...(menuChoice === 1 ? magicBuffers : []),
    ...(menuChoice === 2 ? logBuffers : []),
  ];

  return (
    <ScreenStack
      width={width}
      height={height}
      magnification={magnification}
      gutter='black'
      hints={[
        `(${keyAlias(keyMap.up)}/`,
        `${keyAlias(keyMap.down)}) to select,`,
        ` (${keyAlias(keyMap.left)}/`,
        `${keyAlias(keyMap.right)}) to change menu,`,
        ` (${keyAlias(keyMap.select)}) to select`,
        ` (${keyAlias(keyMap.cancel)}) to cancel`,
      ].join('')}
      buffers={[
        { fg: '#c7c7c7', buffer: [
          `➧${name}`,
          ['HP:', `${hp}`.padStart(3, ' '), 'ヽ', `${minifyNumbers(maxHp)}`.padStart(3, ' '),
          ' G:', gold].join(''),
          [
            'A:', `${strength}`.padStart(2, ' '),
            '  D:', `${defense}`.padStart(2, ' '),
            '  S:', `${speed}`.padStart(2, ' '),
          ].join(''),
          TABS.join(' '),
        ]},
        { bg: '#c7c7c7', fg: 'black', buffer: [
          '', '', '',
          [...Array.from(TABS.slice(0, menuChoice).join(' '), () => ''), ...(menuChoice ? [''] : []), ...TABS[menuChoice].split('')]
        ]},
        ...lowerBuffers,
      ]}
    />
  );
}
