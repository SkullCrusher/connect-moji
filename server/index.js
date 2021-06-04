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

        this.state.connected = false;

        // Process the message.
        this.state.client.onmessage = async e => {

            try {

                // Parse the message and just send back debugging message.
                const msg = JSON.parse(e.data);

                const originalLength = msg["payload"].length;

                // Decrypt the message.
                msg["payload"] = decryptMessage(msg.payload, context.state.encryptionKey);

                if(originalLength > 0 && msg["payload"].length === 0){
                    context.state.client.send(JSON.stringify({ "requestId": msg.requestId, "error": "invalid_encryption" }));
                    return
                }

                // Process the message.
                const processResult = await handleMessage(msg);

                let toSend = {
                    "requestId": msg.requestId,
                    "response": encryptMessage(JSON.stringify(processResult), context.state.encryptionKey)
                }

                toSend = JSON.stringify(toSend);

                // Send the payload to the server.
                context.state.client.send(toSend);
            }catch(e){
                // console.log("e", e)
                context.state.client.send(JSON.stringify({ "error": "invalid_encryption" }));
            }

        }

        // Wait for the client to connect using async/await
        // await new Promise(resolve => this.state.client.once('open', resolve));
        await new Promise((resolve, reject) => {

            // If we were able to open the connection.
            context.state.client.onopen = () => {
                context.state.connected = true;
                resolve()
            };

            // If there was an error connecting.
            context.state.client.onerror = e => {

                // Automatically attempt to reconnect if it's down.
                if(context.state.connected){
                    context.hostMiddleware(url, handleMessage, encryptionKey)
                    return;
                }

                // We weren't connected so don't do anything.
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

                    // Parse the message and just send back debugging message.
                    const parsed = JSON.parse(msg);

                    let originalLength = parsed.payload.length;

                    // Decrypt the message.
                    parsed["payload"] = decryptMessage(parsed.payload, context.state.encryptionKey);

                    if(originalLength > 0 && parsed.payload.length === 0){
                        socket.send(JSON.stringify({ "requestId": parsed.requestId, "error": "invalid_encryption" }));
                        return
                    }

                    // Process the message.
                    const processResult = handleMessage(parsed);

                    const response = {
                        "requestId": parsed.requestId,
                        "response":  encryptMessage(JSON.stringify(processResult), context.state.encryptionKey)
                    }

                    // Encrypt the data to send back.
                    let toSend = JSON.stringify(response);

                    socket.send(toSend);

                }catch(e){
                    // console.log("e", e)
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

