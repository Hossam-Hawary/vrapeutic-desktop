// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require("electron");

// const asyncMsgBtn = document.getElementById('async-msg')

// asyncMsgBtn.addEventListener('click', () => {
//     ipcRenderer.send('asynchronous-message', 'ping')
// })

ipcRenderer.on("console-log", (event, options) => {
    var node = document.createElement("p");
    node.style.color = options.color;
    var spanNode = document.createElement("span");
    var textNode = document.createTextNode(options.msg);
    var timeNode = document.createTextNode(`~> [${(new Date()).toLocaleTimeString()}] `);
    var elmnt = document.getElementById("console-body");
    spanNode.appendChild(timeNode);
    node.appendChild(spanNode);
    node.appendChild(textNode);
    elmnt.appendChild(node);
    window.scrollTo(0, document.body.scrollHeight);
});
