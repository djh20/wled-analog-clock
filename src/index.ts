import Config from "./config";
import axios from "axios";
import { CronJob } from "cron";
import { resolve as resolvePath } from "node:path";
import Device, { DeviceInfo, DeviceState, LightSource, Segment } from "./device";
import { getDistanceToLed, getRandomElement, getRandomNumber, map } from "./utils";

const configPath = resolvePath(__dirname, "../config.json");
const config = new Config();

async function init() {
  console.log("Initializing...");

  console.log("- Loading config...");
  await config.load(configPath);

  if (!config.data) return console.log("  Error: No config data found!");
  console.log("  Success.");

  console.log("\n- Scheduling job...");

  const job = new CronJob(
    "*/10 * * * * *",
    updateAll,
    null,
    true
  );

  console.log("  Success.");

  await updateAll();
}

async function updateAll() {
  if (!config.data) return;

  for (const device of config.data.devices) {
    await update(device);
  }
}

async function update(device: Device) {
  if (!config.data) return;

  let date = new Date();

  // If a time offset has been set, add it to the current time.
  if (device.timeOffset) {
    date = new Date(date.getTime() + device.timeOffset);
  }

  const minute = date.getMinutes();

  if (device.lastDate && device.lastDate.getMinutes() === minute) return;
  device.lastDate = date;

  console.log(`\nUpdating ${device.ip}...`);
  
  // Use modulo to get the hour from 0 to 12; this is useful for calculating the
  // progress of the hour hand.
  const hour = date.getHours() % 12;

  // Calculate the minute hand progress.
  const minuteHandProgress = minute / 60;

  // Calculate the hour hand progress. We add the minute hand progress to get
  // more precision.
  const hourHandProgress = (hour + minuteHandProgress) / 12;
  
  const playEffect = (minute === 0);
  const baseUrl = "http://" + device.ip;

  // Fetch the device info so we can see how many LEDs there are.
  console.log("- Fetching device info...");

  const infoResponse = await axios.get<DeviceInfo>(
    baseUrl + "/json/info", 
    {timeout: 2500}
  ).catch(() => console.log("  Failed!"));

  if (!infoResponse) return;
  console.log("  Success.");

  const info = infoResponse.data;
  
  let segments: Segment[] = new Array(info.leds.maxseg);
  let segmentPos = 0;

  // Initialize each segment to be invalid. This will cause WLED to delete
  // the segments that are not used.
  for (let i = 0; i < segments.length; i++) {
    segments[i] = {start: 0, stop: 0};
  }

  if (!playEffect) {
    const hourHandLed = hourHandProgress * info.leds.count;
    const minuteHandLed = minuteHandProgress * info.leds.count;

    // Define the light sources for the hour and minute hands.
    // TODO: Make these configurable in config.json.
    const sources: LightSource[] = [
      {
        position: hourHandLed, 
        brightness: 255,
        radius: 1.5
      },
      {
        position: minuteHandLed, 
        brightness: 255,
        radius: 1.5
      }
    ];

    for (let i = 0; i < info.leds.count; i++) {
      // Calculate the brightness of the LED for each source.
      const brightnesses = sources.map(source => {
        const distance = getDistanceToLed(i, source.position, info.leds.count);
        return Math.round(
          map(distance, source.radius, 0, 0, source.brightness)
        );
      });

      // Choose the highest brightness
      const brightness = Math.max(...brightnesses);
      if (brightness <= 0) continue;

      // Define a segment for this LED.
      segments[segmentPos] = {
        on: true,
        start: i,
        stop: i + 1,
        fx: 0,
        col: [[255, 255, 255]],
        bri: brightness
      };

      segmentPos++;
    }

  } else {
    segments[0] = {
      on: true,
      start: 0,
      stop: info.leds.count,
      fx: getRandomNumber(0, info.fxcount-1),
      sx: getRandomNumber(0, 255),
      ix: getRandomNumber(0, 255),
      col: [
        getRandomElement(config.data.effectColors)
      ],
      bri: 255
    };
  }
  
  console.log("\n- Sending data...")

  // Send the segments to the device.
  await axios.post(
    baseUrl + "/json/state",
    <DeviceState>{
      seg: segments,
      transition: 3
    }
  );

  console.log("  Success.");
}

init();
