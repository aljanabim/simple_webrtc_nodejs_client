const { spawn } = require("child_process");
const ROSLIB = require("roslib");

let ros;
let port;
const processes = {};
const pubTopics = {};
const subTopics = {};

const launch = (name, command, args, _port = 9090) => {
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


const setup_topics = (my_config, channel) => {

    // create ROS publication topics
    for (var config_idx in my_config.webrtc_node_pubs) {
        var pub_config = my_config.webrtc_node_pubs[config_idx];
        var topic_name = pub_config.namespace + pub_config.topic;
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
            pub.advertise();
            pubTopics[topic_name] = pub;
        }
    }
    console.log("Created publications ", pubTopics);

    // create ROS subscription topics
    for (var config_idx in my_config.webrtc_node_subs) {
        var sub_config = my_config.webrtc_node_subs[config_idx];
        var topic_name = sub_config.namespace + sub_config.topic;
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
            // subscribe to topic
            var sub_callback = function(topic_name) {
                return function(message) {
                    console.log("Heard data from ", topic_name, ", sending it off");
                    const full_message = JSON.stringify({
                        "message_type": topic_name,
                        "content": JSON.stringify(message)
                    })
                    channel.send(full_message);
                }
            }(topic_name);
            sub.subscribe(sub_callback);
            subTopics[topic_name] = sub
        }
    }
    console.log("Created subscriptions ", subTopics);
};
const setup = (my_config, channel) => {
    (async() => {
        while(!ros) {
            console.log("Waiting for ROS network to finish setting up");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setup_topics(my_config, channel);
    })();
};

const message = (name, message) => {
    try {
        const msg = new ROSLIB.Message(JSON.parse(message));
        if (ros) {
            if (pubTopics[name]) {
              pubTopics[name].publish(msg);
            } else {
              console.log("Trying to publish to unconfigured topic");
            }
        } else {
            console.log("Received message: ", message);
            console.log("However, ROS network not established yet");
        }
    } catch(err) {
        console.log("Received an invalid message: ", message);
        return;
    }
};

module.exports = {
    launch,
    stopAll,
    initRos,
    setup,
    message,
};
