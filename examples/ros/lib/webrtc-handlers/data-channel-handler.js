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
        const { data } = event;
        const msg = JSON.parse(data);
        if (msg.message_type === "launch"){
          console.log("Launching ", msg.content, " b/c ", peerId,
                      " wants to");

        } else if (msg.message_type === "stop"){
          console.log("Stopping ROS b/c ", peerId, " wants to");

        } else {
          console.log("Received ROS message for topic ", msg.message_type,
                      " from ", peerId);

        }
    };
    const onClose = (event) => {
        /*
            YOUR CODE HERE - This code is executed when the data channel is closed.
            For example, log the closing event to the console:
        */
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
