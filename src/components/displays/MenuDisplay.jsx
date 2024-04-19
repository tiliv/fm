import { useEffect } from 'react';

import ScreenStack from '../../components/ScreenStack';

export default function MenuDisplay({ width, height }) {



  return (
    <ScreenStack
      gutter="#c7c7c7"
      defaultFg="black"
      width={width}
      height={height}
      magnification={2}
      buffers={[
        { bg: 'black', fg: '#c7c7c7', buffer: [
          'Menu',
        ]},
        { fg: 'black', buffer: [
          '',
          '1:New Game',
          '2:Load Game',
          '3:Options',
          '4:Exit',
        ]},
      ]}
    />
  );
}
