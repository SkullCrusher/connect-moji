const WebSocket                          = require('ws');
const { encryptMessage, decryptMessage } = require('../helpers');


module.exports = class Server {

    constructor() {
        this.state = {
            encryptionKey: "",
        }

        this.host             = this.host.bind(this);
        this.setEncryptionKey = this.setEncryptionKey.bind(this);
    }
   /**
    * host
    * Host a new server.
    */
   async host(handleMessage, encryptionKey){

    const context = this;

    // If we have an encryption key, set it.
    if(encryptionKey !== undefined && encryptionKey.length > 0){
        this.state.encryptionKey = encryptionKey;
    }

    const server = new WebSocket.Server({ port: 8080 });
      
    let sockets = [];

    server.on('connection', function(socket) {
        sockets.push(socket);
      
        // When you receive a message, send that message to every socket.
        socket.on('message', function(msg) {
            
            try {
                // Decrypt the message.
                msg = decryptMessage(msg, context.state.encryptionKey);   

                // Parse the message and just send back debugging message.
                const parsed = JSON.parse(msg);

                // Process the message.
                const processResult = handleMessage(parsed);

                const response = { "requestId": parsed.requestId, "response":  processResult }

                // Encrypt the data to send back.
                let toSend = encryptMessage(JSON.stringify(response), context.state.encryptionKey);

                socket.send(toSend);

            }catch(e){
                socket.send(JSON.stringify({ "error": "invalid_encryption" }));
            }
        });
      
        // When a socket closes, or disconnects, remove it from the array.
        socket.on('close', function() {
          sockets = sockets.filter(s => s !== socket);
        });
    });
  };
  /**
   * setEncryptionKey
   * Set a new encryption key.
   * 
   * @param {string} encryptionKey 
   * 
   * @returns null
   */
  setEncryptionKey(encryptionKey){
      this.state.encryptionKey = encryptionKey;
  };
}

