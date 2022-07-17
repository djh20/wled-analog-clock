# WLED Analog Clock
A Node.js program for controlling WLED devices that have their LEDs around or inside an analog clock. 

The program lights up LEDs to follow the hour and minute hands of the clock. This makes it easier to tell the time... and it looks pretty cool.

*Note: This requires a seperate device to be running the program. A better way to make something like this would be through a WLED usermod.*

**This project is in early development - expect bugs and missing features.**

## Installation
You must have have NPM and Node.js installed (v16 recommended).

1. Clone or download this repository.
2. Run `npm ci` in the directory to install all of the dependencies.
3. Run `npm run compile` to compile the source code.
4. Make a copy of `config.example.json` and rename it to `config.json`.
5. Open `config.json` and change the settings to match your setup.
6. Run `npm run start` to run the program.

After completing these steps, the program should begin interfacing with your WLED device(s).

**Power must be activated on the WLED web interface for the LEDs to turn on.**
