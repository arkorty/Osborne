import { NextRequest } from "next/server";
import { WebSocketServer } from "ws";

interface ExtendedNextRequest extends NextRequest {
  socket: {
    server: {
      wss?: WebSocketServer;
    };
    on: (event: string, listener: (...args: any[]) => void) => void;
  };
}

export async function GET(req: ExtendedNextRequest) {
  const { socket } = req;

  if (!socket?.server?.wss) {
    const wss = new WebSocketServer({ noServer: true });
    socket.server.wss = wss;

    wss.on("connection", (ws) => {
      ws.on("message", (message) => {
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(message.toString());
          }
        });
      });
    });

    socket.on("upgrade", (request: any, socket: any, head: any) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  }

  return new Response("WebSocket setup complete");
}
