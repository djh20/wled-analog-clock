import Config from "./config";
import axios from "axios";
import { CronJob } from "cron";
import { resolve as resolvePath } from "node:path";
import { DeviceInfo, DeviceState, LED, LightSource, Segment } from "./device";
import { getDistanceToLed, map } from "./utils";

const configPath = resolvePath(__dirname, "../config.json");
const config = new Config();

async function update() {
  if (!config.data) return;
  console.log("\nUpdating...");

  let date = new Date();

  // If a time offset has been set, add it to the current time.
  if (config.data.timeOffset) {
    date = new Date(date.getTime() + config.data.timeOffset);
  }

  // Use modulo to get the hour from 0 to 12; this is useful for calculating the
  // progress of the hour hand.
  const hour = date.getHours() % 12;
  const minute = date.getMinutes();

  // Calculate the minute hand progress.
  let minuteHandProgress = minute / 60;

  // Calculate the hour hand progress. We add the minute hand progress to get
  // more precision.
  let hourHandProgress = (hour + minuteHandProgress) / 12;

  // Iterate through each device defined in the config file.
  for (const device of config.data.devices) {
    console.log(device.ip);
    const baseUrl = "http://" + device.ip;

    // Fetch the device info so we can see how many LEDs there are.
    const infoResponse = await axios.get<DeviceInfo>(
      baseUrl + "/json/info", 
      {timeout: 2500}
    ).catch(() => console.log("- Failed to fetch device info!"));

    if (!infoResponse) continue;
    console.log("- Fetched device info.");

    const info = infoResponse.data;
    
    let segments: Segment[] = new Array(info.leds.maxseg);
    let segmentPos = 0;

    // Initialize each segment to be invalid. This will cause WLED to delete
    // the segments that are not used.
    for (let i = 0; i < segments.length; i++) {
      segments[i] = {start: 0, stop: 0};
    }

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

      const led: LED = {
        col: [255, 255, 255],
        bri: brightness
      };
      
      // Define a segment for this LED.
      segments[segmentPos] = {
        on: true,
        start: i,
        stop: i + 1,
        fx: 0,
        col: [led.col],
        bri: led.bri
      };

      segmentPos++;
    }
    
    // Send the segments to the device.
    await axios.post(
      baseUrl + "/json/state",
      <DeviceState>{
        seg: segments,
        transition: 3
      }
    );

    console.log("- Sent data to device.");
  }
}

// Load the config file and then run the update function.
config.load(configPath).then(() => {
  console.log("Loaded config.");
  update();
});

// Schedule a cron job to run the update function every minute.
const job = new CronJob(
  "* * * * *",
  update,
  null,
  true
);
