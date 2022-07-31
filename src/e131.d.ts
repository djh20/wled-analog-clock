declare module "e131" {
  export class Client {
    constructor(ip: string, port?: number);
    createPacket(numSlots: number): Packet;
    send(packet: Packet, callback?: () => {}): void;
  }

  export class Packet {
    getSlotsData(): Buffer;
    setSourceName(name: string): void;
    setUniverse(universe: number): void;
    setOption(option: number, state: boolean): void;
    setPriority(priority: number): void;
  }
}
