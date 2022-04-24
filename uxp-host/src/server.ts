import express from "express";
import http from "http";
import { Server } from "socket.io";

const startServer = async () => {
  const port = 4040;
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET"],
      // @ts-ignore
      transports: ["websocket"],
    },
  });

  server.listen(port, () => {});

  io.on("connection", (socket) => {
    io.emit("server-connection", true);
    socket.on("disconnect", () => io.emit("uxp-connected", false));
    socket.on("uxp-connected", () => io.emit("uxp-connected", true));
    socket.on("uxp-export", ({ name, items }) =>
      io.emit("uxp-export", { name, items })
    );
    socket.on("uxp-reload", ({ name }) => io.emit("uxp-reload", { name }));
    socket.on("host-edit", ({ width, height, name, generation, layers }) =>
      io.emit("host-edit", { width, height, name, generation, layers })
    );
  });

  io.on("reconnect", () => io.emit("server-connection", true));
  process.on("exit", () => io.emit("server-connection", false));
};

startServer();
