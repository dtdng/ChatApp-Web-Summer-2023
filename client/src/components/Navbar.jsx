import React, { useContext } from "react";


import { AuthContext } from "../context/AuthContext";
const Navbar = () => {
  
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="navbar">
      <span className="logo1">DDD chat</span>
      <div className="user">
        <img src={currentUser.photoURL} alt="" />
        <span>{currentUser.displayName}</span>
        
      </div>
    </div>
  );
};

export default Navbar;

