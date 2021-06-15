# Simple WebRTC Node.js Client

WebRTC is an evolving technology for peer-to-peer communication on the web. This repository demonstrates how this technology can be used to establish a peer connection from a Node.js instance. The networking topology is based on a [meshed network](https://webrtcglossary.com/mesh/). Any successful WebRTC connection requires a signaling server for the peers to exchange ICE candidates and session description protocol (SDP). The WebRTC client in this repository is compatible with the signaling server created in the following [repository](https://github.com/aljanabim/simple_webrtc_signaling_server).

#### Table of Contents

-   [Installation](#Installation)
-   [Usage](#Usage)
    -   [Development](#Development)
    -   [Production](#Production)
-   [Examples](#Examples)
    -   [Terminal Chat App](#terminal-chat-app)
    -   [ROS Client App](#ros-client-app)
-   [Implement Your Own Logic](#implement-your-own-logic)
    -   [Overall app logic](#overall-app-logic)
    -   [Utilize the WebRTC Data Channel](#utilize-the-webrtc-data-channel)
-   [Resources](#Resources)
-   [To Do](#to-do)

## Installation

Make sure to have both [Node.js](https://nodejs.org/en/download/) and [Yarn](https://classic.yarnpkg.com/en/docs/install) installed.

```bash
git clone https://github.com/aljanabim/simple_webrtc_nodejs_client.git
cd simple_webrtc_nodejs_client
yarn install
```

## Usage

This client works out of the box with the signaling server created in the [Simple WebRTC Signaling Server](https://github.com/aljanabim/simple_webrtc_signaling_server) repository. Make sure you have a running local or deployed instance of the signlaing server before proceeding. You can use the signaling server locally, to play with the client logic and the examples, or deploy it on the web using your deployment service of choice (eg. Heroku, GCP, AWS, Azure, Vercel, Netlify, etc.).

### Development

For **development** make sure to update the environment variables, in [/config/dev.env](/config/dev.env), according to the configuration of your signaling server. Then run:

```bash
yarn dev [--id]
```

For example, `yarn dev --id=vehicle1`, where `--id` denotes the peer ID to use for the client. This ID must be **unique** for each peer. If not specified, the machine hostname will be used.

Once you have everything up and running it is time to either play with the [examples](#Examples) or to [Implement your own logic](#implement-your-own-logic)

### Production

For **production** make sure to update the environment variables, in [/config/prod.env](/config/prod.env), according to the configuration of your signaling server. Then run:

```bash
yarn start [--id]
```

For example, `yarn start --id=drone1`, where `--id` denotes the peer ID to use for the client. This ID must be **unique** for each peer. If not specified, the machine hostname will be used.

Once you have everything up and running it is time to either play with the [examples](#Examples) or to [Implement your own logic](#implement-your-own-logic)

## Examples

By default all examples will use the development environment, specified in [/config/dev.env](/config/dev.env). This can be modified in the [package.json](package.json) file, if you know what to do.

### Terminal Chat App

Is a terminal based chat app that utilizes the WebRTC data channel to send messages to all peers at once or to a specific peer. You can play with it by running

```bash
yarn chat
```

The code for the chat app is found in [/examples/chat](/examples/chat)

### ROS Client App

Is an example showing how WebRTC can be utilized for operating and sending data between two robots using [ROS](https://www.ros.org/). It uses Rosbridge server to communicate between ROS and Node.js. The data between the robots is, then, sent across the RTCDataChannel. For more details, make sure to checkout the [README](./examples/ros/README.md) of the example.

You can play with the examples by running

```bash
yarn ros
```

The code for the ROS client app is found in [/examples/ros](/examples/ros).

Checkout the [README](./examples/ros/README.md) of the example to understand how it works.

## Implement Your Own Logic

Your app logic can be divided in two parts: 1. the logic you want to implment for the over all app, and 2. the logic based on the data sent across the data channel for each peer. Let's go through how to implement both scenarios.

### Overall app logic

The over all app logic can be implement in [server.js](server.js) after the signaling channel has been connected. It looks like this

```javascript
const channel = new SignalingChannel(PEER_ID, PEER_TYPE, SIGNALING_SERVER_URL, TOKEN);
const webrtcOptions = { enableDataChannel: true, enableStreams: false, dataChannelHandler };
const manager = new WebrtcManager(PEER_ID, PEER_TYPE, channel, webrtcOptions);
channel.connect();

/*
    YOUR CODE HERE - In this file you can implement the overall logic of your application
    once a succesfull peer-to-peer connetion is established.
*/
```

To see how this can be done have a look at the code in the [examples](/examples) directory.

### Utilize the WebRTC Data Channel

Establishing a successful connection for a mesh network of peers in Node.js is a messy process. The purpose of this repository is to give you a starter code for a hassle-free experience with WebRTC. It is then left up to you to decide what to do with the data channel. Modifying the data channel to suit your needs is easy. You simply need to change the behaviour of the event listeners `onOpen()`, `onMessage()` and `onClose()` inside [/lib/webrtc-handlers/data-channel-handler.js](/lib/webrtc-handlers/data-channel-handler.js). The code you have to modify looks like this:

```javascript
const onOpen = (event) => {
    /* 
        YOUR CODE HERE - This code is executed when the data channel opens.
        For example, you can send data to the peer:
    */
    channel.send(`Hello from ${ourPeerId}`);
};
const onMessage = (event) => {
    /* 
        YOUR CODE HERE - This code is executed when a message is received from the peer.
        For example, extract the data and log it to the console:
    */
    const { data } = event;
    console.log(peerId, "says:", `"${data}"`); // put peer data inside quotation marks
};
const onClose = (event) => {
    /* 
        YOUR CODE HERE - This code is executed when the data channel is closed.
        For example, log the closing event to the console:
    */
    console.log(`Channel with ${peerId} is closing `);
};
```

To see how this can be done have a look at the code in the [examples](/examples) directory.

## Resources

If you are interested in the resources that were used to create this repository, have look at the following links:

-   https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation#the_perfect_negotiation_logic
-   https://w3c.github.io/webrtc-pc/#perfect-negotiation-example

## To Do

-   [ ] Ensure rollbacks work
-   [ ] Robustify negotiation process and allow polite peers to
-   [ ] Create media stream handler

---

Best of Luck with your WebRTC adventures. If you have any feedback, don't hestitate to reach out ☺.
