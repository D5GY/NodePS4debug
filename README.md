# NodePS4debug

A easy to use, fully async wrapper for PS4debug written in JavaScript.

## Installation

Use the package manager [npm](https://nodejs.org/en/) to install NodePS4debug.

```bash
npm install nodeps4debug
```

## Usage

```javascript
const { connect, notify, disconnect } = require("nodeps4debug");

(async() => {
  await connect('192.168.137.166') // Returns true or an error code.
  const notifyResponse = await notify('Hello');
  console.log(notifyResponse); // Returns a Buffer
  console.log(disconnect()) // Returns a boolean
  console.log(await getProcessList()) // Returns an Object
})().catch(console.error);
```

## Contributors

- [Jinx](https://github.com/D5GY) - Main package developer.
- [avieah](https://github.com/Cykotic) - Main package developer.
- [DeathRGH](https://github.com/DeathRGH) - Contributing addresses and helping port code.

## Helpful links

- [ps4debug](https://github.com/jogolden/ps4debug)
- [PyPS4debug](https://github.com/Jay184/PyPS4debug)
