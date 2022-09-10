import dgram from "dgram";

//https://github.com/akashgoswami/udpeer/blob/master/bin.js
export default class udpNetwork {
  static getInstance;

  dataChannel = "DATA";
  thisPeer = null;
  peers = [];

  constructor() {
    udpNetwork.getInstance = this;

    this.thisPeer = dgram.createSocket("udp4");
    this.thisPeer.on("error", (err) => {
      console.log("DGRAM server error:", err.stack);
    });
    this.thisPeer.on("message", (msg, rinfo) => {
      console.log("DGRAM server got:", msg, "from", rinfo.address, rinfo.port);
    });
    this.thisPeer.on("listening", () => {
      const address = this.thisPeer.address();
      console.log("DGRAM server listening", address.address, address.port);
    });
    this.thisPeer.on("connect", () => {
      console.log("on connect");
    });
    this.thisPeer.bind(parseInt(process.env.UDP_PORT));

    const _peers = process.env.PEER_URLS;
    const peerArray = _peers.split("|").filter( el => el !== "");
    for (let i = 0; i < peerArray.length; i++) {
      const parts = peerArray[i].split(":");
      const ip = parts[0];
      const port = parseInt(parts[1]);

      this.thisPeer.connect(port, ip);
    }
  }

  send(packetId, data) {
    this.thisPeer.emit(packetId, data);
  }
}
