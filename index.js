const { default: PromiseSocket } = require('promise-socket');
const { Socket } = require('net');
const socket = new PromiseSocket(new Socket());

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

module.exports = {
  connect
}