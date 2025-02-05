const {
  default: PromiseSocket
} = require('promise-socket');
const {
  Socket
} = require('net');
const socket = new PromiseSocket(new Socket());
const Utils = require('./utils');

/**
 * Connects to the PS4.
 * @param {string} ip - The IP address to connect to.
 * @param {string} port - The port to connect to.
 * @returns {Promise<boolean>}
 */
const connect = async (ip, port = 744) => {
  try {
    await socket.connect(port, ip);
    return true;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Disconnects from the PS4.
 * @returns {boolean} - Returns true if disconnection is successful.
 */
const disconnect = () => {
  socket.destroy();
  return true;
}

/**
 * Sends a command to reboot the console.
 * This function triggers a reboot operation on the connected console by sending the appropriate command packet.
 */
const reboot = async () => { 
  Utils.sendCMDPacket(Utils.commands.CMD_CONSOLE_REBOOT, 0, socket)
}
 
/**
 * Notifies the PS4.
 * @param {string} message - Notification message.
 * @param {number} type - Notification type.
 * @returns {Promise<any>} - Returns the status received from the PS4.
 */
const notify = async (message, type = 222) => {
  try {
    await Utils.sendCMDPacket(Utils.commands.CMD_CONSOLE_NOTIFY, Utils.commands.CMD_CONSOLE_NOTIFY_PACKET_SIZE, socket);
    await socket.write(Utils.intToBuffer(type));
    await socket.write(Utils.intToBuffer(message.length + 1));
    await socket.write(Uint8Array.from(Buffer.from(message)));
    await socket.write(Uint8Array.from([0x00]));
    return await Utils.receivedStatus(socket);
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Retrieves a list of processes from the PS4.
 * This function sends a command to get the list of processes, receives and interprets the data.
 * 
 * @returns {Promise<Object>} An Object containing the number of processes and Object Array with names and PIDs.
 */
const getProcessList = async () => {
  try {
    await Utils.sendCMDPacket(Utils.commands.CMD_PROC_LIST, 0, socket);
    await Utils.receivedStatus(socket);

    const numberBuffer = await socket.read(4);
    const number = numberBuffer.readInt32LE();
    const data = await socket.read(number * Utils.commands.PROC_LIST_ENTRY_SIZE);
    let processArray = []

    for (let i = 0; i < number; i++) {
      let offset = i * Utils.commands.PROC_LIST_ENTRY_SIZE;
      processArray.push({
        name: data.toString('ascii', offset, offset + 32).replace(/\0.*$/, ''),
        id: data.readInt32LE(offset + 32)
      });
    }

    return {
      number,
      processArray
    };
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Writes memory to a specific process on the PS4 by sending a command with associated payload.
 * This function constructs a payload that includes the process ID, memory address, and the
 * length of the data to be written. It sends this payload along with the actual data to the PS4
 * using the provided socket connection.
 *
 * @param {number} pid - The process ID to which the memory will be written.
 * @param {number} address - The memory address in the process's space where the data will start to be written.
 * @param {Buffer} value - The data to write to the specified memory address. This should be a Buffer containing the binary data.
 * @returns {Promise<boolean>} A promise that resolves to a status indicating whether the memory write was successful.
 */
const writeMemory = async (pid, address, value) => {
  try {
    const payload = Buffer.alloc(16);
    payload.writeUInt32LE(pid, 0);
    payload.writeUInt32LE(address, 4);
    payload.writeUInt32LE(value.length, 12);

    await Utils.sendCMDPacket(Utils.commands.CMD_PROC_WRITE, Utils.commands.CMD_PROC_WRITE_PACKET_SIZE, socket);

    await socket.write(payload);
    await socket.write(value);

    await Utils.receivedStatus(socket);
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Reads memory from a specific process on the PS4 by sending a command with associated payload.
 * This function constructs a payload that includes the process ID, memory address, and the
 * length of data to be read. It sends this payload to the PS4 using the provided socket connection
 * and then reads the response data from the socket.
 *
 * @param {number} pid - The process ID from which to read memory.
 * @param {number} address - The memory address in the process's space from which to start reading.
 * @param {number} length - The number of bytes to read from the specified memory address.
 * @returns {Promise<Buffer>} A promise that resolves to a buffer containing the read data if successful.
 */
const readMemory = async (pid, address, length) => {
  try {
    const payload = Buffer.alloc(16);
    payload.readUInt32LE(pid, 0);
    payload.readUInt32LE(address, 4);
    payload.readUInt32LE(length, 12);

    await Utils.sendCMDPacket(Utils.commands.CMD_PROC_WRITE, Utils.commands.CMD_PROC_WRITE_PACKET_SIZE, socket);

    await socket.read(payload);
    await socket.read(length);

    await Utils.receivedStatus(socket);
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Loads an ELF file into a specified process.
 * @param {number} pid - The process ID.
 * @param {Buffer} buffer - The ELF file buffer.
 * @returns {Promise<bigint>} - Returns the address where the ELF was loaded.
 */
const loadElf = async (pid, buffer) => {
  try {
    await Utils.sendCMDPacket(Utils.commands.CMD_PROC_ELF, Utils.commands.CMD_PROC_ELF_PACKET_SIZE, socket);
    await socket.write(Utils.intToBuffer(pid));
    await socket.write(Utils.intToBuffer(buffer.length));
    await Utils.receivedStatus(socket);

    await socket.write(buffer);
    await Utils.receivedStatus(socket);

    const response = await socket.read(8);
    return response.readBigUInt64LE(0);
  } catch (error) {
     throw new Error(error);
  }
};


module.exports = {
  connect,
  disconnect,
  reboot,
  notify,
  getProcessList,
  writeMemory,
  readMemory,
  loadElf
}
