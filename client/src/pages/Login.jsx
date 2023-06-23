import React from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./style.scss";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import logo from "../img/logo.png";
import facebook from "../img/facebook.png";
import google from "../img/google.png";
import continue_img from "../img/continue.png";
import { socket } from "../socket";
import { signInWithPopup, FacebookAuthProvider, GoogleAuthProvider } from "firebase/auth";

const Login = () => {
  const signInWithFacebook = () => {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
    .then((re) => {
      console.log(auth.currentUser);
      createUserWithEmailAndPassword(auth, auth.currentUser.email, auth.currentUser.password);
      signInWithEmailAndPassword(auth, auth.currentUser.email, auth.currentUser.password);
      socket.connect();
      navigate("/");
    })
    .catch((err) => {
      console.log(err.message);
    })
  }

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
    .then((re) => {
      console.log(auth.currentUser.email);
      createUserWithEmailAndPassword(auth, auth.currentUser.email, auth.currentUser.password);
      signInWithEmailAndPassword(auth, auth.currentUser.email, auth.currentUser.password);
      socket.connect();
      navigate("/");
    })
    .catch((err) => {
    
    })
  }
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      socket.connect();
      navigate("/");
    } catch (error) {
      setErr(true);
    }
  };
  return (
    <div className="loginPage">
      <div className="container">
        <div className="welcomeSection">
          <div className="header">
            <img src={logo} alt="" srcset="" />
            <span> DDD Chat</span>
          </div>
          <div className="content">
            <div className="title">WELCOME BACK,</div>
            <div className="subtitle">sign in to continue access app</div>
          </div>
        </div>
        <div className="formWrapper">
          <span className="title">Sign in</span>
          <form action="" className="form" onSubmit={handleSubmit}>
            <input type="email" placeholder="email" />
            <input type="password" placeholder="password" />
            <button className="button">
              Sign Up <img src={continue_img} alt="" srcset="" />
            </button>
            <p>
              Don’t have an account ? <Link to="/register">Register</Link>{" "}
            </p>
            <p>Or sign in with</p>
            <div className="methodLogin">
              <button className="loginfb" onClick={signInWithFacebook}>
                <img src={facebook} alt="" srcset="" />
              </button>
              <button className="logingg" onClick={signInWithGoogle}>
                <img src={google} alt="" srcset="" />
              </button>
            </div>
          </form>
          {err && <span>Your email or password is incorrect</span>}
        </div>
      </div>
    </div>
  );
};

export default Login;
