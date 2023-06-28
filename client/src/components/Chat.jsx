import React, { useContext, useState, useEffect, useCallback } from "react";
import "../pages/style.css";
import Cam from "../img/video_call.png";
import online from "../img/available.png";
import offline from "../img/unavailable.png";
import Messages from "./Messages";
import search from "../img/search.png";
import more from "../img/more_vert.png";
import Input from "./Input";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import Notification from "./Notification";
import { socket } from "../socket";


const Chat = ({roomID, receiverUserID, senderUserID,showNotification, caller, state}) => {
  // console.log("CHAT")
  const [buttonCreated, setButtonCreated] = useState(false);
  const { data } = useContext(ChatContext);
  
  // console.log("showNotification",showNotification)
  // console.log(showNotification)
  const { currentUser } = useContext(AuthContext);
  // const [printMsgEndedCall, setprintMsgEndedCall] = useState(false);
  // useEffect(() => {
    // console.log("======================================")
  const handleSelect = () => { 
      // ==============================================================================
      // console.log("roomID",data.chatId)
      // console.log("roomID2",roomID)
    
    let roomID = data.chatId
    let host = currentUser.displayName
    let client_name = data.user.displayName
    // useEffect(() => {
    socket.emit("calling", 
      {
        receiverUserID: data.user.uid,
        senderID: currentUser.uid,
        roomID: data.chatId,
      })
    
    // if(data.chatId===roomID){
    socket.on("turn_window_call", ()=>{
      // console.log("turn_window_call",roomID)
      const redirectURL = `http://localhost:3006/sfu/${roomID}/${host}/`;
      window.open(`${redirectURL}`, '_blank','width=800,height=600');
      
      const handleMsgEvent = (event) => {
        if (event.origin === 'http://localhost:3006') {
          // Check the message data to identify the event
          if (event.data === 'tabClosed') {
            // Tab is closed
            console.log(4)
            socket.emit("sendEndedCallMsg",{
              receiverUserID: currentUser.uid,
              roomID: roomID,
            })
          }
        }
      }
      window.addEventListener('message', handleMsgEvent);
      

    })
  // }
    // ============================================================================
  }
    
  

   
  
    // setButtonCreated(true)
  



  return (
    <div className="chat">
      {showNotification ? <Notification roomID={roomID} receiverUserID={receiverUserID} senderUserID={senderUserID} caller = {caller} state={state}/> : null}
      <div className="chatInfoBox">
        {data.user.uid && (
          <div class="chatInfo">
            <div className="receiverInfo">
              <img src={data.user?.photoURL} alt="" />
              <span>{data.user?.displayName}</span>
            </div>
            <div className="chatIcons">
            {/* {!showNotification ? */}
              <img
                id="myButton"
                className="chatIcon"
                src={Cam}
                alt=""
                data-toggle="tooltip"
                data-placement="top"
                title="Call Video"
                onClick={handleSelect}
              />
              {/* <img className="chatIcon" src={search} alt="" /> */}
              
              <img className="chatIcon" src={more} alt="" /> 
              {/* <img src="" alt="" /> */}
            </div>
          </div>
        )}
      </div>
      
      <Messages />
      <Input />
    </div>
  );
};
// printMsgEndedCall={printMsgEndedCall? printMsgEndedCall:null}
export default Chat;