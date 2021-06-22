// IMPORTS
const os = require("os");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;
const SignalingChannel = require("./lib/signaling-channel");
const WebrtcManager = require("./lib/webrtc-manager");
const dataChannelHandler = require("./lib/webrtc-handlers/data-channel-handler");
// CONSTANTS
const TOKEN = process.env.TOKEN;
const SIGNALING_SERVER_URL = process.env.SIGNALING_SERVER_URL;
const PEER_ID = argv.id ? argv.id : os.hostname().replace(/[^a-zA-Z]/g, ""); // get hostname and strip it from special characters
/** @type {string} - can for example be 'admin' | 'vehicle' | 'robot'  depending on you application*/
const PEER_TYPE = "admin";

// SETUP SIGNALING CHANNEL AND WEBRTC
const channel = new SignalingChannel(PEER_ID, PEER_TYPE, SIGNALING_SERVER_URL, TOKEN);
const webrtcOptions = { enableDataChannel: true, enableStreams: false, dataChannelHandler };
const manager = new WebrtcManager(PEER_ID, PEER_TYPE, channel, webrtcOptions, (verbose = true));
channel.connect();

/*
    YOUR CODE HERE - In this file you can right the overall logic of your application
    once a succesfull peer-to-peer connetion is established.
*/
