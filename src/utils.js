const {
  Socket
} = require("net");
const {
  default: PromiseSocket
} = require("promise-socket");
class Utils {
  constructor() {
    this.commands = {
      CMD_PACKET_MAGIC: [0xCC, 0xBB, 0xAA, 0xFF],
      CMD_CONSOLE_NOTIFY: [0x04, 0x00, 0xDD, 0xBD],
      CMD_PROC_LIST: [0x01, 0x00, 0xAA, 0xBD],
      CMD_PROC_MAPS: [0x04, 0x00, 0xAA, 0xBD],
      CMD_PROC_INFO: [0x0A, 0x00, 0xAA, 0xBD],
      CMD_PROC_WRITE: [0x03, 0x00, 0xAA, 0xBD],
      CMD_PROC_READ: [0x02, 0x00, 0xAA, 0xBD],
      CMD_CONSOLE_REBOOT: [0x01, 0x00, 0xDD, 0xBD], // 0xBD 0xDD 0x00 0x01
      CMD_CONSOLE_NOTIFY_PACKET_SIZE: 8,
      PROC_LIST_ENTRY_SIZE: 36,
      PROC_MAP_ENTRY_SIZE: 58,
      PROC_PROC_INFO_SIZE: 184,
      CMD_PROC_MAPS_PACKET_SIZE: 4,
      CMD_PROC_INFO_PACKET_SIZE: 4,
      CMD_PROC_WRITE_PACKET_SIZE: 16,
      CMD_PROC_READ_PACKET_SIZE: 16
    }
  }

  /**
   * Sends a command packet to the PS4.
   * @param {Array} cmdType - Command type.
   * @param {number} packetSize - Packet size.
   * @param {PromiseSocket<Socket>} socket
   * @returns {Promise<boolean>} - Returns true if the command packet is successfully sent.
   */
  sendCMDPacket = async (cmdType, packetSize, socket) => {
    let packetBuffer = this.appendBuffer(this.commands.CMD_PACKET_MAGIC, cmdType);
    packetBuffer = this.appendBuffer(packetBuffer, this.intToBuffer(packetSize));
    try {
      await socket.write(packetBuffer);
      return true;
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * 
   * @param {PromiseSocket<Socket>} socket
   */
  receivedStatus = async (socket) => {
    await socket.read(4);
  }
  /**
   * 
   * @param {Buffer} buffer1 
   * @param {Buffer} buffer2 
   * @returns 
   */
  appendBuffer = (buffer1, buffer2) => {
    let buffer = new Uint8Array(buffer1.length + buffer2.length);
    buffer.set(new Uint8Array(buffer1), 0);
    buffer.set(new Uint8Array(buffer2), buffer1.length);
    return buffer;
  }

  /**
   * 
   * @param {number} int 
   * @returns 
   */
  intToBuffer = (int) => {
    let buffer = new Buffer.alloc(4);
    buffer.writeUInt32LE(int);
    return buffer;
  }

}
module.exports = new Utils;