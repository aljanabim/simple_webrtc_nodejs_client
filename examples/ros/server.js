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
const verbose = false;

const webrtcOptions = { enableDataChannel: true, enableStreams: false, dataChannelHandler, verbose };

const inquirer = require("inquirer");

// LOAD ROS CONFIG
const rosConfig = require('./ros_config.json')

console.log("Starting up the WebRTC ROS Node Example");

const questions = [
    {
        type: "input",
        name: "nodename",
        message: "Pick a ROS node name (must be unique)",
    },
    {
        type: "confirm",
        name: "connect",
        message: "Are you ready to connect to the signaling server? (Hit enter for YES)",
        default: true,
        when({ nodename }) {
            channel = new SignalingChannel(nodename, PEER_TYPE, SIGNALING_SERVER_URL, TOKEN, verbose);
            manager = new WebrtcManager(nodename, PEER_TYPE, channel, webrtcOptions);
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
const rosMenu = [
    {
        type: "number",
        name: "rosAction",
        message: "Possible actions- \n [1] Run a launch file \n [2] Send a ROS message \n [3] Stop ROS \n Choose a number: ",
    },
];

const send = (destination, type, message) => {
    const full_message = JSON.stringify({
        "message_type": type,
        "content": message
    })
    if (destination === "All") {
        for (peer in manager.peers) {
            manager.peers[peer].dataChannel.send(full_message);
        }
    } else {
      const peer = manager.peers[destination];
      if (peer) {
          peer.dataChannel.send(full_message);
      }
    }
}

const launchQuestions = (peersArray) => [
    {
        type: "input",
        name: "launchFileName",
        message: "Name of launch file: ",
    },
    {
        type: "list",
        name: "sendTo",
        message: "Run launch file on: ",
        choices: peersArray,
    },
];
const launch = (peersArray) => {
    inquirer.prompt(launchQuestions(peersArray)).then((launchAnswers) => {
      var launchMsg = {
          "config": rosConfig["default"],
          "fileName": launchAnswers.launchFileName
      };
      if (rosConfig[launchAnswers.sendTo]) {
          launchMsg = {
              "config": rosConfig[launchAnswers.sendTo],
              "fileName": launchAnswers.launchFileName,
          }
      }
      send(launchAnswers.sendTo, "launch",
           launchMsg);
      rosApp();
    });
};

const msgQuestions = (peersArray) => [
    {
        type: "input",
        name: "rosTopic",
        message: "ROS topic name: ",
    },
    {
        type: "input",
        name: "rosMsg",
        message: "ROS message (in JSON format): ",
    },
    {
        type: "list",
        name: "sendTo",
        message: "Send to: ",
        choices: peersArray,
    },
];
const msg = (peersArray) => {
    inquirer.prompt(msgQuestions(peersArray)).then((msgAnswers) => {
        send(msgAnswers.sendTo, msgAnswers.rosTopic,
             msgAnswers.rosMsg);
        rosApp();
    });
}

const stopQuestions = (peersArray) => [
    {
        type: "list",
        name: "sendTo",
        message: "Stop whose ROS : ",
        choices: peersArray,
    },
];
const stop = (peersArray) => {
    inquirer.prompt(stopQuestions(peersArray)).then((stopAnswers) => {
        send(stopAnswers.sendTo, "stop", "");
        rosApp();
    });
}

const rosApp = () => {
    inquirer.prompt(rosMenu).then((menuAnswers) => {
        let peersArray = [];
        if (manager && manager.peers) {
            peersArray = Object.keys(manager.peers);
            if (peersArray.length > 1) {
                peersArray.push("All");
            } else if (peersArray.length === 0) {
                peersArray.push("No peers found, try again!");
            }
        }
        if (!menuAnswers.rosAction) {
            console.log("Did not give a number");
        } else if (menuAnswers.rosAction === 1) {
            launch(peersArray)
        } else if (menuAnswers.rosAction === 2) {
            msg(peersArray)
        } else if (menuAnswers.rosAction === 3) {
            stop(peersArray)
        } else {
            console.log("Gave an invalid choice");
            rosApp();
        }
    });
};

const init = () => {
    inquirer.prompt(questions).then((answers) => {
        if (!answers.connect) {
            channel.disconnect();
            init();
        } else {
            rosApp();
        }
    });
};
init();
