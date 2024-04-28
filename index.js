const { default: PromiseSocket } = require('promise-socket');
const { Socket } = require('net');
const socket = new PromiseSocket(new Socket());

const commands = {
  CMD_PACKET_MAGIC: [0xCC, 0xBB, 0xAA, 0xFF],
  CMD_CONSOLE_NOTIFY: [0x04, 0x00, 0xDD, 0xBD],
  CMD_CONSOLE_NOTIFY_PACKET_SIZE: 8,
}

/**
 * 
 * @param { Number } ip 
 * @param { string } port 
 * @returns
 */
const connect = async (ip, port = 744) => {
  try {
    await socket.connect(port, ip);
    return true;
  } catch (error) {
    throw new Error(error);
  }
}

const disconnect = () => {
  socket.destroy();
  return true;
}

/**
 * 
 * @param { string } message 
 * @param { number } type 
 * @returns 
 */
const notify = async (message, type = 222) => {
  try {
    await sendCMDPacket(commands.CMD_CONSOLE_NOTIFY, commands.CMD_CONSOLE_NOTIFY_PACKET_SIZE);
    await socket.write(intToBuffer(type));
    await socket.write(intToBuffer(message.length + 1));
    await socket.write(Uint8Array.from(Buffer.from(message)));
    await socket.write(Uint8Array.from([0x00]));
    return await recivedStatus();
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  connect,
  disconnect,
  notify
}

async function sendCMDPacket (cmdType, packetSize) {
  let packetBuffer = appendBuffer(commands.CMD_PACKET_MAGIC, cmdType);
  packetBuffer = appendBuffer(packetBuffer, intToBuffer(packetSize));
  try {
    await socket.write(packetBuffer);
    return true;
  } catch (error) {
    throw new Error(error)
  }
}

async function recivedStatus () {
  let status = await socket.read(4);
  return status;
}

function appendBuffer(buffer1, buffer2) {
  let buffer = new Uint8Array(buffer1.length + buffer2.length);
  buffer.set(new Uint8Array(buffer1), 0);
  buffer.set(new Uint8Array(buffer2), buffer1.length);
  return buffer;
}
function intToBuffer(int) {
  let buffer = new Buffer.alloc(4);
  buffer.writeUInt32LE(int);
  return buffer;
}