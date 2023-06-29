import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import "./style.scss";
import { socket } from "../socket";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Notification from "../components/Notification";

let caller_name;
let sender;
let room_call;
let statee;
let receiverUserID2;
let call_type;
const Home = () => {
  // connect to socket when go to the homepage
  const [showNotification, setShowNotification] = useState(false);
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) {
    socket.connect();
  }

  socket.on("messageNoti", ({receiverUserID,senderUserID, senderName, roomID, state, type}) => {
    sender = senderUserID
    caller_name = senderName
    room_call = roomID
    statee = state
    receiverUserID2=receiverUserID
    call_type = type
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, 10000); 
  });

  socket.on("turn_off_notification", ()=>{
    console.log("turn_off_notification")
    setShowNotification(false);
  })
  // console.log(showNotification)
  return (
    <div className="home">
      <div className="container">

        <Sidebar />
        <Chat roomID={room_call} receiverUserID={receiverUserID2} senderUserID={sender} showNotification={showNotification} caller={caller_name} state={statee} type={call_type}/>
      </div>
    </div>
  );
};

export default Home;
