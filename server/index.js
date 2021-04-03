const WebSocket = require('ws');


module.exports = class Core {

  state = {

  }

  /**
   * host
   * Host a new server.
   */
  host = async () => {

    const server = new WebSocket.Server({
        port: 8080
      });
      
      let sockets = [];

      server.on('connection', function(socket) {
        sockets.push(socket);
      
        // When you receive a message, send that message to every socket.
        socket.on('message', function(msg) {

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

