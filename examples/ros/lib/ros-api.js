const { spawn } = require("child_process");
const ROSLIB = require("roslib");

let ros;
let port;
const processes = {};
const pubTopics = {};
const subTopics = {};

const launch = (name, command, _port = 9090) => {
    processes[name] = spawn(command, [...args]);
    port = _port;
    processes[name].stdout.on("data", (data) => {
        // Initialize ROS client when once the server has started
        if (data.includes(`WebSocket server started at ws://0.0.0.0:${_port}`)) {
            initRos();
        }
        console.log(`stdout: ${data}`);
    });

    processes[name].stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });
    processes[name].on("close", (code) => {
        console.log(`child process exited with code ${code}`);
    });
};

const stopAll = () => {
    for (const process in processes) {
        if (processes[process]) {
            console.log(`Killing ${process}`);
            processes[process].kill();
            processes[process] = null;
        }
    }
    if (ros) {
        ros.close();
        ros = null;
    }
};

const initRos = () => {
    ros = new ROSLIB.Ros({
        url: `ws://0.0.0.0:${port}`,
    });
    ros.on("connection", () => {
        "Connected to ROS websocket server";
    });
    ros.on("error", (error) => {
        console.log("Error connecting to ROS websocket server: ", error);
    });
    ros.on("close", () => {
        console.log("Connection to ROS websocket server closed.");
    });
};

const setup = (my_config, channel) => {
    // create ROS publication topics
    for (var pub_config in my_config.webrtc_node_pubs) {
        var topic_name = pub_config["namespace"] + pub_config["topic"];
        // to prevent echos don't allow same name for pub and sub
        if (topic_name in subTopics) {
            console.log('Found duplicate name; ignoring publication ',
                        topic_name);
        } else {
            var pub = new ROSLIB.Topic({
                ros : ros,
                name : topic_name,
                messageType : pub_config.ros_message_type
            });
            pubTopics[topic_name] = pub;
        }
    }

    // create ROS subscription topics
    for (var sub_config in my_config.webrtc_node_subs) {
        var topic_name = sub_config["namespace"] + sub_config["topic"];
        // to prevent echos don't allow same name for pub and sub
        if (topic_name in pubTopics) {
            console.log('Found duplicate name; ignoring subscription ',
                        topic_name);
        } else {
            var sub = new ROSLIB.Topic({
                ros : ros,
                name : topic_name,
                messageType : sub_config.ros_message_type
            });
            subTopics[topic_name] = sub
        }
    }

    // create subscription callbacks (send data onto data channel)
    for (var topic_name in subTopics) {
        var sub_callback = function(topic_name) {
            return function(message) {
                console.log("Heard data from ", sub, ", sending it off");
                const full_message = JSON.stringify({
                    "message_type": topic_name,
                    "content": message
                })
                channel.send(full_message);
            }
        }(topic_name);
        subTopics[topic_name].subscribe(sub_callback);
        console.log('WebRTC node subscribed to ', topic_name);
    }
};

const message = (name, message) => {
    const msg = new ROSLIB.Message({ ...message });
    if (pubTopics[name]) {
      pubTopics[name].publish(msg);
    } else {
      console.log("Trying to publish to unconfigured topic");
    }
};

module.exports = {
    launch,
    stopAll,
    initRos,
    setup,
    message,
};
