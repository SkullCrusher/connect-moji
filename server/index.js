const WebSocket = require('ws');
const crypto    = require("crypto");


function decryptMessage(data, encryptionKey){

    // If we don't have an encryption key, just return the value.
    if(encryptionKey === ""){
        return data;
    }

    // get password's md5 hash
    let password_hash = crypto.createHash('md5').update(encryptionKey, 'utf-8').digest('hex').toUpperCase();
    let iv            = new Buffer.alloc(16);
    let decipher      = crypto.createDecipheriv('aes-256-cbc', password_hash, iv);

    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}

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

            sockets.forEach(s => s.send(JSON.stringify(debuggingResponse)));
        });
      
        // When a socket closes, or disconnects, remove it from the array.
        socket.on('close', function() {
          sockets = sockets.filter(s => s !== socket);
        });
    });
  };
}

