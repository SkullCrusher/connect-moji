const Server = require('./server');
const na     = new Server();

// Example encryption key.
const encryptionKey = "debug_encryption_key";

function handleMessage(payload){
    return "handle message result"
}

// Host a listener.
na.host(handleMessage, encryptionKey)
