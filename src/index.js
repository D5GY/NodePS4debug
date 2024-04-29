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
 * Retrieves a list of process maps from the PS4.
 * This function sends a command to get the process maps for a specific PID, receives and interprets the data.
 * @param {number} pid - Process ID to retrieve the maps for.
 * @returns {Promise<Object>} An object containing the process ID and arrays with map entries.
 */
const getProcessMaps = async (pid) => {
  try {
    await Utils.sendCMDPacket(Utils.commands.CMD_PROC_MAPS, Utils.commands.PROC_MAP_ENTRY_SIZE, (pid), socket);
    await Utils.receivedStatus(socket);

    const numberBuffer = await socket.read(4);
    const number = numberBuffer.readInt32LE(0);
    const data = await socket.read(number * Utils.commands.PROC_MAP_ENTRY_SIZE);
    let entries = [];

    for (let i = 0; i < number; i++) {
      let offset = i * Utils.commands.PROC_MAP_ENTRY_SIZE;
      entries.push({
        name: data.toString('ascii', offset, offset + 32).replace(/\0.*$/, ''),
        start: data.readBigUInt64LE(offset + 32),
        end: data.readBigUInt64LE(offset + 40),
        offset: data.readBigUInt64LE(offset + 48),
        prot: data.readUInt16LE(offset + 56)
      });
    }

    return {
      pid,
      entries
    };
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Retrieves detailed information for a specific process from the PS4.
 * @param {number} pid - The process ID for which to retrieve information.
 * @returns {Promise<Object>} An object containing detailed information about the process.
 */
const getProcessInfo = async (pid) => {
  try {
    await Utils.sendCMDPacket(Utils.commands.CMD_PROC_INFO, Utils.commands.CMD_PROC_INFO_PACKET_SIZE, (pid), socket);

    const dataBuffer = await socket.read(Utils.commands.PROC_PROC_INFO_SIZE);
    if (dataBuffer.length < Utils.commands.PROC_PROC_INFO_SIZE) {
      throw new Error('Incomplete process information received.');
    }

    return {
      pid: dataBuffer.readInt32LE(0),
      name: dataBuffer.toString('ascii', 4, 36).replace(/\0.*$/, ''),
    };
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  connect,
  disconnect,
  notify,
  getProcessList,
  getProcessMaps,
  getProcessInfo,
}