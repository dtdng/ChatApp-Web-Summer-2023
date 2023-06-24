import React, { useContext } from "react";
import "../pages/style.css";
import { socket } from "../socket";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";

const Notification = ({roomID, senderUserID, caller}) => {
    const { currentUser } = useContext(AuthContext);

    const acceptCalling = ()=>{
        socket.emit("accept_call",{
            receiverUserID: senderUserID,
            // senderID: currentUser.uid,
        })
        const host = currentUser.displayName

        const redirectURL = `http://localhost:3006/sfu/${roomID}/${host}`;
        window.open(`${redirectURL}`, '_blank','width=800,height=600');
    }
    const declineCalling = ()=>{
    console.log("DECLINEE")
    }

  return (
    <div className="notification">
      <p>{caller} is calling</p>
      
      <button id="accept" onClick={() => acceptCalling()}>Accept</button>
      <button id="decline" onClick={() => declineCalling()}>Decline</button>
    </div>
  );
};

export default Notification;