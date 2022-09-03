import spawn from "child_process";
import path from "path";
import { delay } from "./utils.js";

export default class PyConnect {
  static connected;
  static grpcProcess;
  static grpc;
  static server() {
    return new Promise((resolve, reject) => {
      if (!PyConnect.connected) {
        console.log(
          "PythonConnector – making a new connection to the python layer"
        );
        PyConnect.grpcProcess = spawn.spawn(
          process.platform == "win32" ? "python" : "python3",
          ["-u", path.join(process.cwd(), "pyserver/main.py")]
        );
        PyConnect.grpcProcess.stdout.on("data", function (data) {
          console.info("python:", data.toString());
          PyConnect.connected = true;
          resolve(PyConnect.grpc);
        });
        PyConnect.grpcProcess.stderr.on("data", function (data) {
          console.error("python:", data.toString());
        });
      } else {
        resolve(PyConnect.grpc);
      }
    });
  }

  static async invoke(method) {
    try {
      return await PyConnect.server().then(async () => {
        await delay(1500);
        method();
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
