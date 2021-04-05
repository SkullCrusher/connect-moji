
const WebSocket = require('ws');
const { makeid, encryptMessage, decryptMessage } = require('../helpers');

module.exports = class Client {

  state = {
    url:              "ws://localhost:8080",
    client:           null,
    encryptionKey:    "",
    timeoutLength:    10000,

    // The error that happened during the connection.
    lastError:        "",
    errorCallback:    null,

    // List of triggers we want to call on message result.
    callbackTriggers: {},
  }
  /**
   * connect
   * Connect to the server.
   */
  connect = async (url, encryptionKey) => {

    // Set the values in place.
    this.state.url           = url;
    this.state.encryptionKey = encryptionKey;

    // Client connect the url.
    this.state.client = new WebSocket(this.state.url)

    // Process the message.
    this.state.client.on('message', this.processMessage);

    // Start up the automatic trigger cleaner.
    setTimeout(this.cleanTriggers, 1);

    // Wait for the client to connect using async/await
    await new Promise(resolve => this.state.client.once('open', resolve));
  };
  /**
   * cleanTriggers
   * Automatically clean the triggers (anything that is over 10x the timeout period).
   * 
   * @returns null;
   */
  cleanTriggers = () => {

    let keys = Object.keys(this.state.callbackTriggers);

    // Loop over the keys.
    for(let i = 0; i < keys.length; i += 1){
      try {

        // If it's expired, remove it.
        if(this.state.callbackTriggers[keys[i]].timestamp + (this.state.timeoutLength * 10) < Date.now()){
          delete this.state.callbackTriggers[keys[i]];
        }
      }catch(e){}
    }

    setTimeout(this.cleanTriggers, 1000);
  }
  /**
   * setEncryption
   * Set the encryption key for the messages.
   * 
   * @param {string} encryptionKey
   * 
   * @return null
   */
  setEncryption = (encryptionKey) => {
    this.state.encryptionKey = encryptionKey
  };
  /**
   * handleError
   * Process an error by calling the callback.
   * 
   * @param {string} error - The error message.
   * 
   * @returns null
   */
  handleError = (error) => {

    // Save the error to our state.
    this.state.lastError = error;

    // Fire off the handler for the error if one happened.
    if(this.state.errorCallback !== null){
      try{
        this.state.errorCallback(error);
      }catch(e){}
    }
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

    // Check if we got a invalid encryption message.
    try{

      const errorTest = JSON.parse(msg);

      // Send back the error.
      if(errorTest.error !== undefined){
        this.handleError(errorTest.error);
        return
      }
    }catch(e){
      // If it's not parsable it is not an error.
    }

    // Descrypt the message.
    msg = decryptMessage(msg, this.state.encryptionKey);

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

    let data = JSON.stringify(builtPayload);

    // Encrypt the data if we have a key.
    if(this.state.encryptionKey !== ""){
      data = encryptMessage(data, this.state.encryptionKey);
    }

    return data;
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
  };
}
