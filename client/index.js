
const { makeid, encryptMessage, decryptMessage } = require('../helpers');

const WebSocket = require("isomorphic-ws");
const debugging = false;


module.exports = class Client {

  constructor() {
    this.state = {
      url:              "ws://localhost:8080",
      client:           null,
      encryptionKey:    "",
      timeoutLength:    10000,
      reconnectDelay:   2500,

      websocketStatus:  "disconnected",

      // The error that happened during the connection.
      lastError:        "",
      errorCallback:    null,

      // List of triggers we want to call on message result.
      callbackTriggers: {},
    }

    this.connect          = this.connect.bind(this);
    this.cleanTriggers    = this.cleanTriggers.bind(this);
    this.setEncryption    = this.setEncryption.bind(this);
    this.handleError      = this.handleError.bind(this);
    this.processMessage   = this.processMessage.bind(this);
    this._buildPayload    = this._buildPayload.bind(this);
    this.waitForResponse  = this.waitForResponse.bind(this);
    this.send             = this.send.bind(this);
    this.attemptReconnect = this.attemptReconnect.bind(this);
    this.setStatus        = this.setStatus.bind(this);
    this.logging          = this.logging.bind(this);
  }
  /**
   * setStatus
   * Set the current state (in the future will trigger callback).
   */
  setStatus(arg){
    this.websocketStatus = arg;
  };
  /**
   * logging
   * Only console log if we are in debug mode.
   */
  logging(arg){
    if(debugging){
      console.log(arg);
    }
  };
  /**
   * connect
   * Connect to the server.
   */
  async connect(url, encryptionKey, retry){

    this.logging("(connect-moji): connecting.");

    let context = this;

    // Set the values in place.
    this.state.url           = url;
    this.state.encryptionKey = encryptionKey;

    // Client connect the url.
    this.state.client = new WebSocket(this.state.url)

    // Process the message.
    this.state.client.onmessage = e => {
      context.processMessage(e.data);
    }

    // To prevent duplicates, block if it's reconnect.
    if(retry !== true){

      // Automatically reconnect.
      this.state.client.onclose = () => {
          this.logging("(connect-moji): Reconnecting")
          this.setStatus("reconnecting")
          this.state.client.close()
          this.attemptReconnect(url, encryptionKey, true)
      };

      // Start up the automatic trigger cleaner.
      setTimeout(this.cleanTriggers, 1);
    }

    // Wait for the client to connect using async/await
    // await new Promise(resolve => this.state.client.once('open', resolve));
    await new Promise((resolve, reject) => {

      // If we were able to open the connection.
      context.state.client.onopen = () => {
        this.logging("(connect-moji): connected")
        context.setStatus("connected")
        resolve()
      };

      // If there was an error connecting.
      context.state.client.onerror = e => {
        context.logging("(connect-moji): error connecting")

        // If we are retrying, don't throw an error.
        if(retry === true){
          context.setStatus("reconnecting")
          context.attemptReconnect(url, encryptionKey, true)
          resolve()
        }else{
          context.setStatus("error")
          reject(e)
        }
      };
    });
  };
  /**
   * attemptReconnect
   * Handle reconnecting to the server.
   **/
  attemptReconnect(url, encryptionKey){

    let context = this;

    setTimeout(() => {
      try{
        context.connect(url, encryptionKey, true)
      }catch(e){
        // Do nothing.
      }
    }, this.state.reconnectDelay);
  };
  /**
   * cleanTriggers
   * Automatically clean the triggers (anything that is over 10x the timeout period).
   * 
   * @returns null;
   */
  cleanTriggers(){

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
  };
  /**
   * setEncryption
   * Set the encryption key for the messages.
   *
   * @param {string} encryptionKey
   *
   * @return null
   */
  setEncryption(encryptionKey){
    this.state.encryptionKey = encryptionKey
  };
  /**
   * setEncryption
   * Set the error handler for messages.
   *
   * @param {func} callback
   *
   * @return null
   */
  setErrorHandler(callback){
      this.state.errorCallback = callback
  };
  /**
   * handleError
   * Process an error by calling the callback.
   * 
   * @param {string} error - The error message.
   * 
   * @returns null
   */
  handleError(error){

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
  processMessage(msg){

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

    // Parse the message so we can put it in the right trigger.
    const parsed = JSON.parse(msg);

    // Descrypt the message.
    parsed.response = decryptMessage(parsed.response, this.state.encryptionKey);

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
  _buildPayload(requestId, event, payload){
    const builtPayload = {
      requestId,
      event,
      payload: encryptMessage(JSON.stringify(payload), this.state.encryptionKey)
    }

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
  waitForResponse(requestId){
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
        await new Promise((resolve, reject)=>{ setTimeout(resolve, 10) })
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
   * @returns {object}
   */
   async send(event, payload){

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
