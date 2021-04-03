

const Core = require('./core');
const na = new Core();


// Connect to the server.
na.connect().then(()=>{
    na.send("event", { "paylozad": "example" })
});

