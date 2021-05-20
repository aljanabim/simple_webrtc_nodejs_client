// IMPORTS
const os = require("os");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;
const SignalingChannel = require("./lib/signaling-channel");
const WebrtcManager = require("./lib/webrtc-manager");
const dataChannelHandler = require("./lib/webrtc-handlers/data-channel-handler");
// CONSTANTS
const TOKEN = process.env.TOKEN;
const HOST_URL = process.env.SIGNALING_SERVER_URI;
const PEER_ID = argv.id ? argv.id : os.hostname().replace(/[^a-zA-Z]/g, ""); // get hostname and strip it from special characters
/** @type {string} - can be 'admin' | 'vehicle' | 'cc' */
const PEER_TYPE = "admin";

// SETUP SIGNALING CHANNEL
const channel = new SignalingChannel(PEER_ID, PEER_TYPE, HOST_URL, TOKEN);
const webrtcOptions = { enableDataChannel: true, enableStreams: false, dataChannelHandler };
const manager = new WebrtcManager(PEER_ID, PEER_TYPE, channel, webrtcOptions);
channel.connect();
