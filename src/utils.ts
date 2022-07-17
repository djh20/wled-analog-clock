export function getDistanceToLed(a: number, b: number, total: number): number {
  const normalDistance = Math.abs(a - b);
  const wrappedDistance = Math.min(normalDistance, total - normalDistance);
  
  return wrappedDistance;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  const mapped: number = ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
  return clamp(mapped, toMin, toMax);
}
