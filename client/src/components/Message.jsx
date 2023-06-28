import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { socket } from "../socket";

// let call_againn;
const Message = ({ message, call_again }) => {
  // call_againn = call_again
  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const ref = useRef();

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

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
      // console.log("turn_window_call")
      const redirectURL = `http://localhost:3006/sfu/${roomID}/${host}`;
      window.open(`${redirectURL}`, '_blank','width=800,height=600');
    })
  };


  return (
    <div
      ref={ref}
      className={`message ${message.senderId === currentUser.uid && "owner"}`}
    >
      <div className="messageInfo">
      </div>
      <div className="messageContent">
        <p
          data-toggle="tooltip"
          data-placement="top"
          title={message.date.toDate().toUTCString()}
        >
          {message.text}
          {call_again==="call_again" ? <button id="call_again" onClick={handleSelect}>Goi lai</button> : null}
        </p>
        
        {message.img && <img src={message.img} alt="" />}
      </div>
    </div>
  );
};

export default Message;
