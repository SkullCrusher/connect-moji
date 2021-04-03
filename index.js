

const Core = require('./core');
const na = new Core();


// Connect to the server.
na.connect().then(async ()=>{
    let result = await na.send("event", { "paylozad": "example" })

    console.log("result", result)
});

