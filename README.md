# connect-moji
 
![logo](connect-moji.png)

> Event driven mobile control framework.

Connect-moji is a simple framework designed to supply information to any number of clients the same data based on event requests only. The design is to allow any number of clients to control the same device without conflict.


## Getting started
WIP

## Installing
```console
npm i https://github.com/SkullCrusher/connect-moji
```

## Examples

Client
```javascript
const { Client } = require('connect-moji');

// Create a new client.
const na = new Client();

// Connect to the server.
na.connect("ws://localhost:8080", "debug_encryption_key").then(async ()=>{

    // Trigger a event and wait for the response.
    let result = await na.send("example-event", { "key": "example" })

    console.log("result", result)
});

```

Server
```javascript
const Server = require('connect-moji');

// Create a new server.
const na     = new Server();

// Handles determing how to process events.
function handleMessage(payload){
    return "result example"
}

// Host a listener.
na.host(handleMessage, "debug_encryption_key")
```

Runnable examples:
- [`Server Example`](https://github.com/SkullCrusher/connect-moji/blob/main/example-server.js) - Sample server
- [`Client Example`](https://github.com/SkullCrusher/connect-moji/blob/main/example-client.js) - Sample client


## Secruity
If a encryption key is provided all traffic is encrypted using AES. In a market where our customers often share account, both renting their account out and with friends, we decided to force the client to know the key (instead of public key encryption). The goal is to prevent access to personal information if a third party is able to gain account access to an account.

In production we force the user to scan a QR code generated by the server which contains the encryption key. It's a quick solution for users to gain access and users can send the qr code to anyone that they want.

> **Note:**
> 
> Public key could easily be added onto the framework or simply implimented on top of the framework using the events and updating the encryption key.

## Contribute
We welcome people to help us improve the framework or request features. Please create a issue for bugs and email us at hi@kickmoji.io for a feature request to talk to us directly.
