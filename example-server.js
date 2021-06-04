const Server = require('./server');
const na     = new Server();

// Example encryption key.
const encryptionKey = "debug_encryption_key2";

function handleMessage(payload){
    return "handle message result"
}

// Host a listener.
na.host(handleMessage, encryptionKey)
