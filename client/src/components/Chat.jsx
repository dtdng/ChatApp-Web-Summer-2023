import React, { useContext } from "react";
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
  const { data } = useContext(ChatContext);
  console.log(showNotification)
  const { currentUser } = useContext(AuthContext);
  const roomId = data.chatId;
  
  const handleSelect = async () => {
    const roomID = data.chatId
    const host = currentUser.displayName
    const client_name = data.user.displayName
    socket.emit("calling", 
      {
        receiverUserID: data.user.uid,
        senderID: currentUser.uid,
        roomID: roomID,
      })
    
    socket.on("turn_window_call", ()=>{
      console.log("turn_window_call")
      const redirectURL = `http://localhost:3006/sfu/${roomID}/${host}`;
      window.open(`${redirectURL}`, '_blank','width=800,height=600');
    })

    

  };

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

export default Chat;