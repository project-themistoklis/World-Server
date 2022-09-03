import * as net from "net";

export default class tcpClient {
  static getInstance;
  client;

  async init(ip, port) {
    tcpClient.getInstance = this;

    this.client = new net.Socket();
    this.client.setNoDelay(true);
    this.client.setKeepAlive(true, 5000);
    this.client.connect(port, ip, function () {
      console.log("connected");
    });
    this.client.on("data", async function (data) {
      const resp = JSON.parse(data + "");
    });
  }

  send(json) {
    if (this.client !== undefined) {
      this.client.write(json);
    }
  }
}
