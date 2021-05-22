// IMPORTS
const os = require("os");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;
const SignalingChannel = require("../../lib/signaling-channel");
const WebrtcManager = require("../../lib/webrtc-manager");
const dataChannelHandler = require("./lib/webrtc-handlers/data-channel-handler");
// CONSTANTS
const TOKEN = process.env.TOKEN;
const SIGNALING_SERVER_URL = process.env.SIGNALING_SERVER_URL;
const PEER_ID = argv.id ? argv.id : os.hostname().replace(/[^a-zA-Z]/g, ""); // get hostname and strip it from special characters
/** @type {string} - can for example be 'admin' | 'vehicle' | 'robot'  depending on you application*/
const PEER_TYPE = "admin";

// SETUP SIGNALING CHANNEL AND WEBRTC
let channel, manager;
let chatChoices = [];
const verbose = false;

const webrtcOptions = { enableDataChannel: true, enableStreams: false, dataChannelHandler, verbose };

const inquirer = require("inquirer");

console.log("Welcome to the WebRTC Terminal Chat App");

const questions = [
    {
        type: "input",
        name: "username",
        message: "Pick a username (must be unique for peer)",
    },
    {
        type: "confirm",
        name: "connect",
        message: "Are you ready to connect to the signaling server? (Hit enter for YES)",
        default: true,
        when({ username }) {
            channel = new SignalingChannel(username, PEER_TYPE, SIGNALING_SERVER_URL, TOKEN, verbose);
            manager = new WebrtcManager(username, PEER_TYPE, channel, webrtcOptions);
            return true;
        },
    },
    {
        type: "confirm",
        when(answers) {
            if (answers.connect) {
                channel.connect();
            }

            return false;
        },
    },
];
const chatQuestions = (peersArray) => [
    {
        type: "input",
        name: "message",
        message: "Message: ",
    },
    {
        type: "list",
        name: "sendTo",
        message: "Send to: ",
        choices: peersArray,
    },
];

const chat = () => {
    let peersArray = [];
    if (manager && manager.peers) {
        peersArray = Object.keys(manager.peers);
        if (peersArray.length > 1) {
            peersArray.push("All");
        } else if (peersArray.length === 0) {
            peersArray.push("None peers found, try again!");
        }
        peersArray.push("Disconnect");
    }
    inquirer.prompt(chatQuestions(peersArray)).then((answers) => {
        if (answers.sendTo === "All") {
            for (peer in manager.peers) {
                manager.peers[peer].dataChannel.send(answers.message);
            }
        } else if (answers.sendTo === "Disconnect") {
            channel.disconnect();
        } else {
            const peer = manager.peers[answers.sendTo];
            if (peer) {
                peer.dataChannel.send(answers.message);
            }
        }
        chat();
    });
};

const init = () => {
    inquirer.prompt(questions).then((answers) => {
        if (!answers.connect) {
            channel.disconnect();
            init();
        } else {
            const all = Object.keys(manager.peers).length > 1 ? "All" : "";
            // chatChoices = [all, Object.keys(manager.peers), "Close"];
            chatChoices = ["oelle", "olle"];
            chat();
        }
    });
};
init();
