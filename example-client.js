
const Client        = require('./client');
const na            = new Client();

const encryptionKey = "debug_encryption_key";

// Connect to the server.
na.connect("ws://localhost:8080", encryptionKey).then(async ()=>{
    let result = await na.send("event", { "payload": "example" })

    console.log("result", result)
});
