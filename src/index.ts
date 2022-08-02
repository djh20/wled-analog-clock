import Config from "./config";
import axios from "axios";
import { resolve as resolvePath } from "node:path";

import Device, { DeviceInfo, DeviceState, LightSource, Segment } from "./device";
import { getDistanceToLed, getRandomElement, getRandomNumber, map } from "./utils";

const configPath = resolvePath(__dirname, "../config.json");
const config = new Config();

let devices: Device[] = [];

async function init() {
  console.log("Initializing...");

  console.log("- Loading config...");
  await config.load(configPath);

  if (!config.data) return console.log("  Error: No config data found!");
  console.log("  Success.");

  console.log("\n- Initializing devices...");

  // Create a device instance for each device defined in the config.
  for (const deviceDef of config.data.devices) {
    const device = new Device(deviceDef);
    devices.push(device);
  }

  console.log("  Success.");

  setInterval(updateAll, 1000);
  await updateAll();
}

async function updateAll() {
  for (const device of devices) {
    await update(device);
  }
}

async function update(device: Device) {
  if (!config.data) return;

  let date = new Date();

  // If a time offset has been set, add it to the current time.
  if (device.definition.timeOffset) {
    date = new Date(date.getTime() + device.definition.timeOffset);
  }

  const minute = date.getMinutes();
  
  // Use modulo to get the hour from 0 to 12; this is useful for calculating the
  // progress of the hour hand.
  const hour = date.getHours() % 12;

  const millisecondHandProgress = date.getMilliseconds() / 1000;

  // Calculate the second hand progress. This is currently only used for making
  // the minute hand progress more accurate
  const secondHandProgress = (date.getSeconds() + millisecondHandProgress) / 60;

  // Calculate the minute hand progress.
  const minuteHandProgress = (minute + secondHandProgress) / 60;

  // Calculate the hour hand progress. We add the minute hand progress to get
  // more precision.
  const hourHandProgress = (hour + minuteHandProgress) / 12;
  
  const effectShouldPlay = (minute === 0);
  const apiUrl = "http://" + device.definition.ip;

  if (effectShouldPlay) {
    if (device.playingEffect) return;
    device.playingEffect = true;

    const infoResponse = await axios.get<DeviceInfo>(
      apiUrl + "/json/info", 
      {timeout: 2500}
    ).catch((err) => console.log(err));
    
    if (!infoResponse) return;

    const info = infoResponse.data;

    const segment: Segment = {
      fx: getRandomNumber(0, info.fxcount-1),
      sx: getRandomNumber(127, 255),
      ix: getRandomNumber(127, 255),
      col: [
        getRandomElement(config.data.effectColors)
      ]
    };

    // Send data to the device.
    await axios.post(
      apiUrl + "/json/state",
      <DeviceState>{
        seg: [segment],
        transition: 3
      }
    );

    return;
  }

  let slotsData = device.packet.getSlotsData();

  const secondHandLed = secondHandProgress * device.definition.ledCount;
  const hourHandLed = hourHandProgress * device.definition.ledCount;
  const minuteHandLed = minuteHandProgress * device.definition.ledCount;

  // Define the light sources for the hour and minute hands.
  // TODO: Make these configurable in config.json.
  const sources: LightSource[] = [
    {
      position: hourHandLed, 
      brightness: 1,
      radius: 1.5
    },
    {
      position: minuteHandLed, 
      brightness: 1,
      radius: 1.5
    },
    /*
    {
      position: secondHandLed, 
      brightness: 0.3,
      radius: 1.5
    },
    */
  ];

  for (let i = 0; i < device.definition.ledCount; i++) {
    // Calculate the brightness of the LED for each source.
    const brightnesses = sources.map(source => {
      const distance = getDistanceToLed(i, source.position, device.definition.ledCount);
      return map(distance, source.radius, 0, 0, source.brightness);
    });

    // Choose the highest brightness
    const brightness = Math.max(...brightnesses);
    
    const value = Math.round(brightness * 255);
    const startSlot = i * 3;

    slotsData[startSlot] = value;
    slotsData[startSlot+1] = value;
    slotsData[startSlot+2] = value;
  }

  device.playingEffect = false;
  device.client.send(device.packet);
}

init();
