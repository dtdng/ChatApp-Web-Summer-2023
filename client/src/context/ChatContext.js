import { createContext, useContext, useReducer } from "react";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const INITIAL_STATE = {
    chatId: "null",
    user: {},
  };

  const chatReducer = (state, action) => {
    switch (action.payload.type) {
      case "DirectMessage":
        return {
          user: action.payload.userInfo,
          type: "DirectMessage",
          chatId: action.payload.roomId,
        };

      case "Group":
        return {
          // user: action.payload.userInfo,
          user:  action.payload.name,
          type: "Group",
          chatId: action.payload.roomId,
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

  return (
    <ChatContext.Provider value={{ data: state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};
