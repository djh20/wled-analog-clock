import Device from "./device";
import { readFile } from "node:fs/promises";

export default class Config {
  public data?: ConfigData;

  constructor() {}

  public async load(filePath: string) {
    const rawData = await readFile(filePath, {encoding: "utf-8"});
    this.data = JSON.parse(rawData);
  }
}

interface ConfigData {
  devices: Device[];
  timeOffset?: number;
}
