import dotenv from "dotenv";
import tcpClient from "./tcpClient.js";
import PyConnect from "./pyconnect.js";

dotenv.config();

PyConnect.invoke(async () => {
  new tcpClient().init(
    process.env.TCP_SERVER_HOST,
    process.env.TCP_SERVER_PORT
  );
});
