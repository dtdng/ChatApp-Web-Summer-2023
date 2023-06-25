import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 3004;

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const onlineUsers = [];
const socket_list = {}
io.on("connection", (socket) => {
  console.log(socket.id);
  let currentUser = {};
  socket.on("setUp", (userID, username) => {
    console.log("hello")
    if (userID != null || username != null) {
      console.log(userID + " : " + username);
      const existingUserIndex = onlineUsers.findIndex((x) => x.uid === userID);
      if (existingUserIndex !== -1) {
        onlineUsers[existingUserIndex] = { userID, username };
      } else {
        currentUser = {
          socketID: socket.id,
          username: username,
          uid: userID,
        };
        socket_list[socket.id] = socket
        onlineUsers.push(currentUser);
        console.log("User added:", onlineUsers[onlineUsers.length - 1]);
      }
      console.log("Online Users:", onlineUsers);
      io.emit("onlineUsers", onlineUsers);
    }
  });

  socket.on("sendMessage", ({ receiverUserID, senderID }) => {
    console.log(1)
    
  });

  socket.on("calling", ({ receiverUserID, senderID, roomID }) => {
    const receiverSocket = onlineUsers.find((x)=> x.uid === receiverUserID);
    const sender_name = onlineUsers.find((x)=> x.uid === senderID).username;
    if(receiverSocket){
      const receiverID = receiverSocket.socketID
      const receiverSocket2 = socket_list[receiverID]
      receiverSocket2.emit("messageNoti",{
        receiverUserID:receiverUserID,
        senderUserID: senderID,
        senderName: sender_name,
        roomID: roomID,
        state: "accepting"
      });
      socket.emit("messageNoti",{
        receiverUserID:receiverUserID,
        senderUserID: senderID,
        senderName: sender_name,
        roomID: roomID,
        state: "waiting"
      });
    }
  });

  socket.on("accept_call", ({ receiverUserID })=>{
    const receiverSocket = onlineUsers.find((x)=> x.uid === receiverUserID);
    if(receiverSocket){
      const receiverID = receiverSocket.socketID
      const receiverSocket2 = socket_list[receiverID]
      receiverSocket2.emit("turn_window_call");
    }
    // socket.emit("turn_window_call")
  })

  socket.on("cancel_call",({receiverUserID, state})=>{
    // console.log("===================================================");
    // console.log("receiverUserID: ",receiverUserID)
    // // console.log("senderID",senderID)
    // console.log("socketID: ",socket.id)
    // console.log("onlineUsers: ",onlineUsers)
    
    const receiverSocket = onlineUsers.find((x)=> x.uid === receiverUserID);
    // console.log("receiverSocket: ",receiverSocket)
    if(receiverSocket){
      const receiverID = receiverSocket.socketID
      const receiverSocket2 = socket_list[receiverID]
      receiverSocket2.emit("turn_off_notification");
      receiverSocket2.emit("missed_call",{state: state});
    }
  })

  socket.on("disconnect", (reason) => {
    console.log(reason);

    const disconnectedUser = onlineUsers.find((x) => x.uid == currentUser.uid);
    if (disconnectedUser !== -1) {
      onlineUsers.splice(onlineUsers.indexOf(disconnectedUser), 1);
      for (let key in socket_list) {
        if (socket_list[key] === socket) {
          delete socket_list[key];
          break;
        }
      }
      console.log("Online Users:", onlineUsers);
      io.emit("onlineUsers", onlineUsers);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
