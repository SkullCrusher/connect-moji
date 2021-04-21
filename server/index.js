const WebSocket                          = require('ws');
const { encryptMessage, decryptMessage } = require('../helpers');


module.exports = class Server {

    constructor() {
        this.state = {
            encryptionKey: "",
            client:        null,
            url:           "",
        }

        this.host             = this.host.bind(this);
        this.setEncryptionKey = this.setEncryptionKey.bind(this);
    }

    async hostMiddleware(url, handleMessage, encryptionKey){

        const context = this;

        // If we have an encryption key, set it.
        if(encryptionKey !== undefined && encryptionKey.length > 0){
            this.state.encryptionKey = encryptionKey;
        }

        // Save the url for later.
        this.state.url = url;

        // Client connect the url.
        this.state.client = new WebSocket(this.state.url)

        // Process the message.
        this.state.client.onmessage = e => {

            try {
                // Decrypt the message.
                let msg = decryptMessage(e.data, context.state.encryptionKey);

                // Parse the message and just send back debugging message.
                const parsed = JSON.parse(msg);

                // Process the message.
                const processResult = handleMessage(parsed);

                const response = { "requestId": parsed.requestId, "response":  processResult }

                // Encrypt the data to send back.
                let toSend = encryptMessage(JSON.stringify(response), context.state.encryptionKey);

                // Send the payload to the server.
                context.state.client.send(toSend);
            }catch(e){
                context.state.client.send(JSON.stringify({ "error": "invalid_encryption" }));
            }

        }

        // Wait for the client to connect using async/await
        // await new Promise(resolve => this.state.client.once('open', resolve));
        await new Promise((resolve, reject) => {

            // If we were able to open the connection.
            context.state.client.onopen = () => { resolve() };

            // If there was an error connecting.
            context.state.client.onerror = e => {
                reject(e)
            };
        });

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

