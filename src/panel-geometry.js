export function computeLeftIndicatorWidth(
  panelWidth,
  centerWidth,
  occupiedLeftWidth
) {
  const sideWidth = Math.max(
    0,
    Math.floor((panelWidth - centerWidth) / 2)
  );

  return Math.max(0, sideWidth - occupiedLeftWidth);
}
