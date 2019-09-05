// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require('electron');

// const asyncMsgBtn = document.getElementById('async-msg')

// asyncMsgBtn.addEventListener('click', () => {
//     ipcRenderer.send('asynchronous-message', 'ping')
// })

ipcRenderer.on('console-log', (event, arg) => {
    console.log(event, arg);
    const message = `~> ${(new Date()).toLocaleTimeString()}:: ${arg}`
    var node = document.createElement("h5");
    var textnode = document.createTextNode(message); 
    var elmnt = document.getElementById('console-body');
    node.appendChild(textnode);
    elmnt.appendChild(node);
    window.scrollTo(0, document.body.scrollHeight);});
