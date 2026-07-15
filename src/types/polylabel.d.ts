declare module 'polylabel' {
  // Pole of inaccessibility (visual centre) of a polygon. `polygon` is an array
  // of rings, each ring an array of [x, y] points (outer ring first). Returns
  // [x, y] with a `distance` property (distance to the polygon edge).
  export default function polylabel(
    polygon: number[][][],
    precision?: number,
    debug?: boolean,
  ): [number, number] & { distance: number };
}
