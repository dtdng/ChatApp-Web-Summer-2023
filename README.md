# ChatApp-Web-Summer-2023
ChatApp project for WebCourse Summer 2023. Using Firebase, ReactJS, and SocketIO tech.
## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Contact](#contact)

## Features

Messaging:
- Sign in/sign out: using email and password.
- Find another user.
- Chat in real-time with other users.
- Create a group chat, and chat with the group. 
- Send the image, video, file


Video call: 
- Call video and sound to each other
- Share the screen
- Real-time chat in a room
- Show all participants in a room
- Control other cameras and sound.
- Group call 


## Technologies Used

- Firebase for authentication, and storage.
- React for the front end.
- SocketIO for the server handling event.

## Installation
In the root directory, you can run:
   `cd client && npm install` for installing the client package
   
then run:
   `cd ../server && npm install` for installing the server package
   
then run :
  `cd .. && npm install mediasoup && npm install` for installing the videocall package

  > **Note**
> only the linux kernel can run the mediasoup lib, or else the call video feature will be disable

## Usage

In the root directory, you can run:

### `npm start`

then you can create an account and use 

 > **Note**
> If u want to use this program on your Firebase console, just change firebaseConfig in .client/firebase.js 

## Contributing

- Cao Dang Dat 
- Nguyen Ngoc Dang
- Nguyen Thanh Dat 

## Contact

If you have any questions, feel free to reach out:

Dang Dat - [dangdatcao2002@gmail.com](mailto:dangdatcao2002@gmail.com)
