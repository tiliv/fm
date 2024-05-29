export function move({ speed, r, c, y, x, tick, directions }) {
  return directions[tick % directions.length];
}
