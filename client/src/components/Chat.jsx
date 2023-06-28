import React, { useContext, useState, useCallback } from "react";
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
  console.log("CHAT")
  console.log("roomID",roomID)
  const { data } = useContext(ChatContext);
  // console.log(showNotification)
  const { currentUser } = useContext(AuthContext);
  // const [printMsgEndedCall, setprintMsgEndedCall] = useState(false);
  const handleSelect =  () => {
    const roomID = data.chatId
    let host = currentUser.displayName
    let client_name = data.user.displayName
    // useEffect(() => {
    socket.emit("calling", 
      {
        receiverUserID: data.user.uid,
        senderID: currentUser.uid,
        roomID: roomID,
      })
    

    socket.on("turn_window_call", ()=>{
      console.log("turn_window_call",roomID)
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
  
  }



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
            {!showNotification ?
              <img
                className="chatIcon"
                src={Cam}
                alt=""
                data-toggle="tooltip"
                data-placement="top"
                title="Call Video"
                onClick={handleSelect}
              />: null}
              {/* <img className="chatIcon" src={search} alt="" /> */}
              
              {!showNotification ? <img className="chatIcon" src={more} alt="" /> : null}
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