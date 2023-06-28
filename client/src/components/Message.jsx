import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";

const Message = ({ message }) => {
  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const ref = useRef();

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  return (
    <div
      ref={ref}
      className={`message ${message.senderId === currentUser.uid && "owner"}`}
    >
      <div className="messageInfo">
        {data.type == "Group" && <span>{message.senderUsername}</span>}
        {data.type == "Group" && (
          <img src={message.senderAvatar} alt="" srcset="" />
        )}
      </div>
      <div className="messageContent">
        <p
          data-toggle="tooltip"
          data-placement="top"
          title={message.date.toDate().toUTCString()}
        >
          {message.text}
        </p>
        {message.img && <img src={message.img} alt="" />}
      </div>
    </div>
  );
};

export default Message;
