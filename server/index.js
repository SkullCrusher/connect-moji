const WebSocket                          = require('ws');
const { encryptMessage, decryptMessage } = require('../helpers');


module.exports = class Core {

  state = {
      encryptionKey: "",
  }
  /**
   * host
   * Host a new server.
   */
  host = async (encryptionKey) => {

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

            // Decrypt the message.
            msg = decryptMessage(msg, context.state.encryptionKey);            

            // Parse the message and just send back debugging message.
            const parsed = JSON.parse(msg);

            const debuggingResponse = {
                "requestId": parsed.requestId,
                "response": "debug message"
            }

            // Encrypt the data to send back.
            let toSend = encryptMessage(JSON.stringify(debuggingResponse), context.state.encryptionKey);

            sockets.forEach(s => s.send(toSend));
        });
      
        // When a socket closes, or disconnects, remove it from the array.
        socket.on('close', function() {
          sockets = sockets.filter(s => s !== socket);
        });
    });
  };
}

