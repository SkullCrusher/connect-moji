
const Client = require('./client');
const na     = new Client();

// Connect to the server.
na.connect("ws://localhost:8080", "debug_encryption_key").then(async ()=>{
    let result = await na.send("event", { "paylozad": "example" })

    console.log("result", result)
});
