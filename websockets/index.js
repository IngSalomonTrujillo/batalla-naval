import { WebSocketServer } from "ws";
import si from "systeminformation";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });
  ws.send("something");
  setInterval(async () => {
    const cpuTemp = JSON.stringify(await si.currentLoad());
    ws.send(cpuTemp);
  }, 1000);
});