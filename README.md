# Simple WebRTC Node.js Client

WebRTC is an evolving technology for peer-to-peer communication on the web. This repository demonstrates how this technology can be used to establish a peer connection from a Node.js instance. The networking topology is based on a [meshed network](https://webrtcglossary.com/mesh/). Any successful WebRTC connection requires a signaling server for the peers to exchange ICE candidates and session description protocol (SDP). The WebRTC client in this repository is compatible with the signaling server created in the following [repository](https://github.com/aljanabim/simple_webrtc_signaling_server).

## Installation

```bash
git clone https://github.com/aljanabim/simple_webrtc_nodejs_client.git
yarn install
```

## Usage

This client works out of the box with the signaling server created in this [repository](https://github.com/aljanabim/simple_webrtc_signaling_server). You can use it locally to play with the client logic, or deploy it on the web using your deployment service of choice (eg. Heroku, GCP, AWS, Azure, Vercel, Netlify, etc.).

### Development

For **development** make sure to update the environment variables, in [/config/dev.env](/config/dev.env), according to the configuration of your signaling server. Then run:

```bash
yarn dev [--id]
```

For example, `yarn dev --id=vehicle1`, where `--id` denotes the peer ID to use for the client. This ID must be **unique** for each peer.

### Production

For **production** make sure to update the environment variables, in [/config/prod.env](/config/prod.env), according to the configuration of your signaling server. Then run:

```bash
yarn start [--id]
```

For example, `yarn start --id=vehicle1`, where `--id` denotes the peer ID to use for the client. This ID must be **unique** for each peer.

## Utilize the WebRTC Data Channel

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

## Resources

If you are interested in the resources that were used to create this repository, have look at the following links:

-   https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation#the_perfect_negotiation_logic
-   https://w3c.github.io/webrtc-pc/#perfect-negotiation-example

## To Do

-   [ ] Ensure rollbacks work
-   [ ] Robustify negotiation process and allow polite peers to
-   [ ] Create media stream handler
