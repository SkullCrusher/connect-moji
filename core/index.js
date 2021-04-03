
const WebSocket = require('ws');

function makeid(length) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

module.exports = class Core {

  state = {
    url:              "debug url",
    client:           null,
    encryptionKey:    "debug_encryption_key",
    
    timeoutLength:    10000,

    // List of triggers we want to call on message result.
    callbackTriggers: {},
  }

  /**
   * connect
   * Connect to the server.
   */
  connect = async () => {

    this.state.client = new WebSocket('ws://localhost:8080')

    this.state.client.on('message', this.processMessage); // msg => console.log(msg));

    // Wait for the client to connect using async/await
    await new Promise(resolve => this.state.client.once('open', resolve));

    console.log("connected")
  };
  /**
   * processMessage
   * Process the message recieved and put it in the callback.
   * 
   * @param {string} msg 
   * 
   * @return null
   */
  processMessage = (msg) => {

    // Parse the message so we can put it in the right trigger.
    const parsed = JSON.parse(msg);

    // If the record doesn't exist, just ignore the message.
    if(this.state.callbackTriggers[parsed.requestId] === undefined){
      return
    }

    // Inject the result.
    this.state.callbackTriggers[parsed.requestId].result = parsed.response;
  };
  /**
   * _buildPayload
   * Generate the payload that is going to be sent to the server.
   * 
   * @param {string} requestId 
   * @param {string} event 
   * @param {object} payload 
   * @returns 
   */
  _buildPayload = (requestId, event, payload) => {
    let builtPayload = {
      requestId,
      event,
      payload
    }

    // TODO encryption.

    return JSON.stringify(builtPayload);
  };
  /**
   * waitForResponse
   * Wait for the callback trigger.
   * 
   * @param {string} requestId 
   * 
   * @returns null 
   */
  waitForResponse = (requestId) => {
    return new Promise(async (resolve, reject) => {

      for(;;){

        // If we can't find the trigger error out.
        if(this.state.callbackTriggers[requestId] === undefined){
          resolve({ "error": "missing_trigger" })

          return
        }

        // Check to see if the record.
        if(this.state.callbackTriggers[requestId].result !== ""){
        
          // make a local copy of the result.
          const result = this.state.callbackTriggers[requestId].result;

          // Erase the trigger record.
          delete this.state.callbackTriggers[requestId];

          // Resolve the record.
          resolve(result);

          return
        }

        // If we should timeout the request.
        if(this.state.callbackTriggers[requestId].timestamp + this.state.timeoutLength < Date.now()){

          // Erase the trigger record.
          delete this.state.callbackTriggers[requestId];

          // Return an error because it timed out.
          resolve({ "error": "timeout" })

          return
        }

        // Delay the loop to prevent spam.
        await new Promise((resolve, reject )=>{ setTimeout(resolve, 10) })
      }
    })
  };
  /**
   * send
   * Send a message to the server.
   * 
   * @param {string} event 
   * @param {object} payload 
   * 
   */
  send = async (event, payload) => {

    // Generate a id for the request so we can process the response.
    const requestId = makeid(32);

    // Build the payload including encryption.
    const builtPayload = this._buildPayload(requestId, event, payload);

    // Set the payload into callback triggers so we can wait for the response.
    this.state.callbackTriggers[requestId] = {
      result:    "",
      timestamp: Date.now(),
    };

    // Send the payload to the server.
    this.state.client.send(builtPayload);

    // Wait for the response.
    return await this.waitForResponse(requestId);
  }

  debug = () => {
    console.log("debug", this.state.url, this.state.encryptionKey, makeid(32))
  }; 
}

