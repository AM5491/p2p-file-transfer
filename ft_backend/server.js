const express = require('express');
const http = require('http'); // node.js's built in module to create a http server
// mediator from peer package which helps in running a PeerJS signaling server
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express(); // creates an express application
const PORT = process.env.PORT || 9000;; // defines port number where above express app will run
app.use(cors());

const activeIDs = new Set(); // will holds the 6 digit PeerId which are currently in use

// below server is needed because PeerJS mediator requires a http server to run
const server = http.createServer(app); // wraps the express app into a http server

// ExpressPeerServer is used to create a PeerJS signaling server
// path : '/myapp' defines the path under which PeerJS will run i.e. 'peerjs/myapp'
const peerServer = ExpressPeerServer(server, { debug: true, path: '/myapp' });

peerServer.on('disconnect', (client) => { // listens when a peer gets disconnected
    const peerId = client.getId(); // retrives peer's ID
    if (activeIDs.has(peerId)) { // checks if a peerId exists or not
        activeIDs.delete(peerId); // if id exists within activeIDs then remove it and make it free for use
        console.log(`Peer ${peerId} disconnected. ID is now available.`);
    }
});

// attaches peerServer mediator with express application
app.use('/peerjs', peerServer);

app.use(express.static('../'));

// creates a new API endpoint http://peerjs/myapp/generate-id
app.get('/generate-id', (request, response) => {
    let newId;
    do {
        newId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (activeIDs.has(newId)); // keeps generating new IDs until it finds one not in activeIDs
    activeIDs.add(newId); // stores the newId as in use
    console.log(`Generated new unique ID: ${newId}. Total active IDs: ${activeIDs.size}`);
    response.json({ id: newId });
});

// creates a new API endpoint http://peerjs/myapp/check-id/123456
app.get('/check-id/:id', (request, response) => {
    const { id } = request.params; // gets peerid provided by reciver
    const idExists = activeIDs.has(id); // checks if provided id exists in activeIDs
    console.log(`Checking ID: ${id}. Exists: ${idExists}`);
    response.json({ idExists: idExists });
});

// default root endpoint
app.get('/', (request, response) => {
    response.sendFile('../index.html', { root: __dirname });
});

server.listen(PORT, () => {
    console.log(`PeerJS server is running on https://p2p-file-transfer-app-jdx6.onrender.com`);
});