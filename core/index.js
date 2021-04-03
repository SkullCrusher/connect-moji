
const WebSocket = require('ws');


module.exports = class Core {

  state = {
    url:              "debug url",
    client:           null,
    encryptionKey:    "debug_encryption_key",

    // List of triggers we want to call on message result.
    callbackTriggers: {},
  }

  /**
   * connect
   * Connect to the server.
   */
  connect = async () => {

    let client = new WebSocket('ws://localhost:8080')

    client.on('message', msg => console.log(msg));

    // Wait for the client to connect using async/await
    await new Promise(resolve => client.once('open', resolve));
  }

  _buildPayload = (event, payload) => {


  }

  /**
   * send
   * Send a message to the server.
   * 
   * @param {string} event 
   * @param {object} payload 
   * 
   */
  send = (event, payload) => {

    // Build the payload including encryption.
    const builtPayload = this._buildPayload(event, payload);

    const callbackFunction = (resolve, reject) => { };

    // Generate a promise that data can be sent back through.
    const returnPromise = new Promise(callbackFunction);


    clients.send('Hello!');

    return returnPromise;
  }

  debug = () => {
    console.log("debug", this.state.url, this.state.encryptionKey)
  }; 
}

