

const Server = require('./server');
const na     = new Server();

const encryptionKey = "debug_encryption_key";

na.host(encryptionKey)