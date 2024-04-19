import useLocation from '../../hooks/useLocation';
import useInteraction from '../../hooks/useInteraction';
import ScreenStack from '../../components/ScreenStack';

const START_WORLD = 'overworld.txt'
const START_Y = 17;
const START_X = 35;

export default function WorldDisplay({ width, height }) {
  const { layers, local, facing, interactions } = useLocation({
    world: START_WORLD,
    x: START_X,
    y: START_Y,
    w: width,
    h: height,
  });
  const { interactionBuffer } = useInteraction({
    facing,
    interactions,
    x: local.x,
    y: local.y,
    w: width,
    h: height,
  });

  const buffers = [
    { fg: '#555', buffer: layers.solid },
    { fg: '#888', buffer: layers.passable },
    { bg: '#00ff0050', fg: '#00ff00', buffer: interactionBuffer },
    { fg: 'black', buffer: layers.objects },
    // { fg: 'red', buffer: [] },
  ];

  return (
    <ScreenStack
      gutter="#c7c7c7"
      defaultFg="black"
      width={width}
      height={height}
      magnification={2}
      buffers={buffers}
    />
  );
}
