/**
 * Handler of the WebRTC data channel. In its three functions (onOpen, onMessage, onClose) you
 *     specify what to do with the data sent across the data channel over the peer connection.
 *
 * @param {String} ourPeerId - Peer ID of our peer
 * @param {String} ourPeerType - Peer Type of our peer
 * @param {Object} peer - The peer object with the useful properties below.
 * @param {String} peer.peerId - Id of peer
 * @param {String} peer.peerType - Type of peer
 * @param {RTCPeerConnection} peer.rtcPeerConnection - RTC peer connection object
 * @param {RTCDataChannel} peer.dataChannel - RTC data channel object
 * @param {Function} peer.remove - Closes all connections and removes the peer. Automatically called when peer leaves signaling server.
 */

const rosApi = require("../ros-api");

function dataChannelHandler(ourPeerId, ourPeerType, peer) {
    const peerId = peer.peerId;
    const channel = peer.dataChannel;

    const onOpen = (event) => {
        /*
            YOUR CODE HERE - This code is executed when the data channel opens.
            For example, you can send data to the peer:
        */
    };
    const onMessage = (event) => {
        try {
            const { data } = event;
            const msg = JSON.parse(data);
            if (msg.message_type === "launch"){
                rosApi.launch("rosLaunchProcess", "roslaunch",
                              [msg.content.fileName]);
                rosApi.setup(msg.content.config, channel);
            } else if (msg.message_type === "stop"){
                rosApi.stopAll();
            } else {
                rosApi.message(msg.message_type, msg.content);
            }
        } catch (error) {
            console.error(error);
            rosApi.stopAll();
        }
    };
    const onClose = (event) => {
      rosApi.stopAll();
    };

    channel.onopen = (event) => {
        if (event.type === "open") {
            channel.onmessage = onMessage;
            channel.onclose = onClose;
            onOpen(event);
        }
    };
}

module.exports = dataChannelHandler;
