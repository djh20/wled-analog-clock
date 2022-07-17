export default interface Device {
  ip: string;
}

/**
 * A simplified version of the response given from the WLED /json/info endpoint.
 */
export interface DeviceInfo {
  leds: {
    count: number,
    maxseg: number;
  }
}

/**
 * A simplified version of the response given from the WLED /json/state endpoint.
 */
export interface DeviceState {
  on?: boolean;
  bri?: number;
  seg?: Segment[];
  transition?: number;
}

export interface LED {
  col: number[];
  bri: number;
}

export interface Segment {
  on?: boolean;
  start?: number;
  stop?: number;
  fx?: number;
  col?: number[][];
  bri?: number;
}

export interface LightSource {
  position: number;
  brightness: number;
  radius: number;
}
