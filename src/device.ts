import { Client, Packet } from "e131";

export default class Device {
  public definition: DeviceDefinition;
  public client: Client;
  public packet: Packet;
  public playingEffect: boolean = false;

  constructor(definition: DeviceDefinition) {
    this.definition = definition;

    this.client = new Client(this.definition.ip);
    this.packet = this.client.createPacket(this.definition.ledCount * 3);
    this.packet.setUniverse(1);
  }
}

export interface DeviceDefinition {
  ip: string;

  /**
   * A time offset in milliseconds. This is useful when the time on the physical
   * clock differs from the time on the system. For example, if the time on the
   * physical clock is 5 minutes ahead, then the offset should be set to 300000
   * (60 x 5 x 1000).
   */
  timeOffset?: number;

  ledCount: number;
}

/**
 * A simplified version of the response given from the WLED /json/info endpoint.
 */
export interface DeviceInfo {
  leds: {
    count: number,
    maxseg: number;
  },
  fxcount: number;
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

export interface Segment {
  on?: boolean;
  start?: number;
  stop?: number;
  fx?: number;
  sx?: number;
  ix?: number;
  col?: number[][];
  bri?: number;
}

export interface LightSource {
  position: number;
  brightness: number;
  radius: number;
}
