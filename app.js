/**
 * integrating mediasoup server with a node.js application
 */

/* Please follow mediasoup installation requirements */
/* https://mediasoup.org/documentation/v3/mediasoup/installation/ */
import express from 'express'
// import http from 'http'
const app = express()
import https from 'httpolyglot'
import fs from 'fs'
import path from 'path'
const __dirname = path.resolve()

import { Server } from 'socket.io'
import mediasoup from 'mediasoup'
import bodyParser from 'body-parser'
const PORT = process.env.PORT || 3006
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res, next) => {
  const path2 = '/sfu/'

  if (req.path.indexOf(path2) == 0 && req.path.length > path.length) return next()

  // res.send(`You need to specify a room name in the path e.g. 'https://127.0.0.1/sfu/room'`)
  res.sendFile(path.join(__dirname, 'form', 'a.html'));
})
let roomID;
let userName;
app.post('/sfu', (req, res) => {
  roomID = req.body.roomID;
  userName = req.body.userName;

  // res.redirect(`/sfu/${roomID}`);
  const redirectURL = `/sfu/${roomID}`;

  // Trả về đoạn mã JavaScript để mở tab mới và chuyển hướng
  res.send(`
    <script>
      window.open('${redirectURL}', '_blank','width=800,height=600');
    </script>
  `);
  

});  

app.use('/sfu/:room/:username', express.static(path.join(__dirname, 'public')))
// export default app;

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync('./server2/ssl/key.pem', 'utf-8'),
  cert: fs.readFileSync('./server2/ssl/cert.pem', 'utf-8')
}

const httpsServer = https.createServer(options, app)
// const httpsServer = http.createServer(app)


httpsServer.listen(PORT, () => {
  console.log('listening on port: ' + PORT)
})
export default httpsServer;
const io = new Server(httpsServer)

// socket.io namespace (could represent a room?)
const connections = io.of('/mediasoup')

/**
 * Worker
 * |-> Router(s)
 *     |-> Producer Transport(s)
 *         |-> Producer
 *     |-> Consumer Transport(s)
 *         |-> Consumer 
 **/
let worker
let rooms = {}          // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
let peers = {}          // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
let transports = []     // [ { socketId1, roomName1, transport, consumer }, ... ]
let producers = []      // [ { socketId1, roomName1, producer, }, ... ]
let consumers = []      // [ { socketId1, roomName1, consumer, }, ... ]
let host_list = {}
const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  })
  console.log(`worker pid ${worker.pid}`)

  worker.on('died', error => {
    // This implies something serious happened, so kill the application
    console.error('mediasoup worker has died')
    setTimeout(() => process.exit(1), 2000) // exit in 2 seconds
  })

  return worker
}

// We create a Worker as soon as our application starts
worker = createWorker()

// This is an Array of RtpCapabilities
// https://mediasoup.org/documentation/v3/mediasoup/rtp-parameters-and-capabilities/#RtpCodecCapability
// list of media codecs supported by mediasoup ...
// https://github.com/versatica/mediasoup/blob/v3/src/supportedRtpCapabilities.ts
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
]

connections.on('connection', async socket => {
  console.log(socket.username)
  socket.emit('connection-success', {
    socketId: socket.id,
  })

  const removeItems = (items, socketId, type) => {
    items.forEach(item => {
      if (item.socketId === socket.id) {
        item[type].close()
      }
    })
    items = items.filter(item => item.socketId !== socket.id)

    return items
  }

  const removeProducerShareScreen = (items, socketId, type) => {
    items.forEach(item => {
      if (item.socketId === socket.id && item.producer.appData.isShareScreen === true) {
        item[type].close()
      }
    })
    items = items.filter(item => item.socketId !== socket.id || (item.socketId === socket.id && item.producer.appData.isShareScreen === false))

    return items
  }

  socket.on('disconnect', () => {
    // do some cleanup
    console.log('peer disconnected')
    consumers = removeItems(consumers, socket.id, 'consumer')
    producers = removeItems(producers, socket.id, 'producer')
    transports = removeItems(transports, socket.id, 'transport')

    const { roomName } = peers[socket.id]

    delete peers[socket.id]

    // remove socket from room
    rooms[roomName] = {
      router: rooms[roomName].router,
      peers: rooms[roomName].peers.filter(socketId => socketId !== socket.id)
    }

    // connections.emit('window_close', { remain_user: rooms[roomName].peers.length})
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    console.log(peers)
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    console.log(producers)
    producers.forEach(producerData => {
      if (producerData.roomName === roomName) {
        const producerSocket = peers[producerData.socketId].socket
        // use socket to send producer id to producer
        console.log(rooms[roomName].peers.length)
        // console.log(producerSocket)
        // console.log(producerSocket.id)
        
        producerSocket.emit('window_close', { remain_user: rooms[roomName].peers.length})
      }
    })

  })

  socket.on('joinRoom', async ({ roomName, host_name }, callback) => {
    // create Router if it does not exist
    // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
    host_list[socket.id] = host_name
    const router1 = await createRoom(roomName, socket.id)

    peers[socket.id] = {
      socket,
      roomName,           // Name for the Router this Peer joined
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: {
        name: '',
        isAdmin: false,   // Is this Peer the Admin?
      }
    }

    // get Router RTP Capabilities
    const rtpCapabilities = router1.rtpCapabilities

    // call callback from the client and send back the rtpCapabilities
    callback({ rtpCapabilities })
  })

  const createRoom = async (roomName, socketId) => {
    // worker.createRouter(options)
    // options = { mediaCodecs, appData }
    // mediaCodecs -> defined above
    // appData -> custom application data - we are not supplying any
    // none of the two are required
    let router1
    let peers = []
    if (rooms[roomName]) {
      router1 = rooms[roomName].router
      peers = rooms[roomName].peers || []
    } else {
      router1 = await worker.createRouter({ mediaCodecs, })
    }
    
    console.log(`Router ID: ${router1.id}`, peers.length)

    rooms[roomName] = {
      router: router1,
      peers: [...peers, socketId],
    }

    return router1
  }


  
  // Client emits a request to create server side Transport
  // We need to differentiate between the producer and consumer transports
  socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
    // get Room Name from Peer's properties
    const roomName = peers[socket.id].roomName

    // get Router (Room) object this peer is in based on RoomName
    const router = rooms[roomName].router


    createWebRtcTransport(router).then(
      transport => {
        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          }
        })

        // add transport to Peer's properties
        addTransport(transport, roomName, consumer)
      },
      error => {
        console.log(error)
      })
  })

  const addTransport = (transport, roomName, consumer) => {

    transports = [
      ...transports,
      { socketId: socket.id, transport, roomName, consumer, }
    ]

    peers[socket.id] = {
      ...peers[socket.id],
      transports: [
        ...peers[socket.id].transports,
        transport.id,
      ]
    }
  }

  const addProducer = (producer, roomName) => {
    producers = [
      ...producers,
      { socketId: socket.id, producer, roomName}
    ]

    peers[socket.id] = {
      ...peers[socket.id],
      producers: [
        ...peers[socket.id].producers,
        producer.id,
      ]
    }
  }

  const addConsumer = (consumer, roomName) => {
    // add the consumer to the consumers list
    consumers = [
      ...consumers,
      { socketId: socket.id, consumer, roomName, }
    ]

    // add the consumer id to the peers list
    peers[socket.id] = {
      ...peers[socket.id],
      consumers: [
        ...peers[socket.id].consumers,
        consumer.id,
      ]
    }
  }

  socket.on('getProducers', callback => {
    //return all producer transports
    const { roomName } = peers[socket.id]

    let producerList = []
    producers.forEach(producerData => {
      if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
        producerList = [...producerList, producerData.producer.id]
      }
    })

    // return the producer list back to the client
    console.log("HOSTT: ", host_list)
    callback(producerList, host_list)
  })

  const informConsumers = (roomName, socketId, id) => {
    console.log(`just joined, id ${id} ${roomName}, ${socketId}`)
    // A new producer just joined
    // let all consumers to consume this producer
    producers.forEach(producerData => {
      if (producerData.socketId !== socketId && producerData.roomName === roomName) {
        const producerSocket = peers[producerData.socketId].socket
        // use socket to send producer id to producer
        producerSocket.emit('new-producer', { producerId: id , host_list})
      }
    })
  }

  const getTransport = (socketId) => {
    const [producerTransport] = transports.filter(transport => transport.socketId === socketId && !transport.consumer)
    return producerTransport.transport
  }

  // see client's socket.emit('transport-connect', ...)
  socket.on('transport-connect', ({ dtlsParameters }) => {
    console.log('DTLS PARAMS... ', { dtlsParameters })
    
    getTransport(socket.id).connect({ dtlsParameters })
  })

  // see client's socket.emit('transport-produce', ...)
  socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
    // call produce based on the prameters from the client
    console.log("kind",kind)
    const producer = await getTransport(socket.id).produce({
      kind,
      rtpParameters,
      appData
    })

    // add producer to the producers array
    const { roomName } = peers[socket.id]

    addProducer(producer, roomName)

    informConsumers(roomName, socket.id, producer.id)

    producer.on('transportclose', () => {
      console.log('transport for this producer closed ')
      producer.close()
    })

    // Send back to the client the Producer's id
    callback({
      id: producer.id,
      producersExist: producers.length>1 ? true : false
    })
  })

  // see client's socket.emit('transport-recv-connect', ...)
  socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
    console.log(`DTLS PARAMS: ${dtlsParameters}`)
    const consumerTransport = transports.find(transportData => (
      transportData.consumer && transportData.transport.id == serverConsumerTransportId
    )).transport
    await consumerTransport.connect({ dtlsParameters })
  })


  let idsharescreen
  

  socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
    try {

      const { roomName } = peers[socket.id]
      const router = rooms[roomName].router
      let consumerTransport = transports.find(transportData => (
        transportData.consumer && transportData.transport.id == serverConsumerTransportId
      )).transport

      // check if the router can consume the specified producer
      if (router.canConsume({
        producerId: remoteProducerId,
        rtpCapabilities
      })) {
        // transport can now consume and return a consumer
        const consumer = await consumerTransport.consume({
          producerId: remoteProducerId,
          rtpCapabilities,
          paused: true,
        })

        // -----------------*************************________________________
        // -----------------*************************________________________
        consumer.on('transportclose', () => {
          console.log('transport close from consumer')
        })
        consumer.on('producerclose', () => {
// =======
//           console.log(2)
// >>>>>>> main
//           console.log('producer of consumer closed')
//           socket.emit('producer-closed', { remoteProducerId })
//           consumerTransport.close([])
//           transports = transports.filter(transportData => transportData.transport.id !== consumerTransport.id)
//           consumer.close()
//           consumers = consumers.filter(consumerData => consumerData.consumer.id !== consumer.id)

        })

        addConsumer(consumer, roomName)

        //CHekc if this consumer is Share Screen or not and get the socketID of the consumer
        let socketID_find
        let isShareScreen_consumer
        producers.forEach(producerData => {
          if (producerData.producer.id === remoteProducerId ) {
            socketID_find = producerData.socketId
            isShareScreen_consumer = producerData.producer.appData.isShareScreen
          }
        })
        // from the consumer extract the following params
        // to send back to the Client
        const params = {
          id: consumer.id,
          producerId: remoteProducerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          serverConsumerId: consumer.id,
          consumer_socketID: socketID_find,
          consumer_isShareScreen: isShareScreen_consumer
        }
        // send the parameters to the client
        callback({ params})
      }
    } catch (error) {
      console.log(error.message)
      callback({
        params: {
          error: error
        }
      })
    }
  })

  socket.on('consumer-resume', async ({ serverConsumerId }) => {
    console.log('consumer resume')
    const { consumer } = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId)
    await consumer.resume()
  });

  socket.on('producerClose', async (data, callback) => {
    console.log("Closing the producer for = " + socket.id)
    // console.log("consumer::", consumers)
    // console.log("producers::", producers)
    // console.log("transports::", transports)
    let producer = await getProducer(socket.id, false)

    producer.close()
    // callback();
    
    // consumers = removeItems(consumers, socket.id, 'consumer')
    producers = removeProducerShareScreen(producers, socket.id, 'producer')
    consumers.forEach(item=>{console.log(item.socketId, item.consumer.producerId)})
    // transports = removeItems(transports, socket.id, 'transport')
  });

  // ====================Chat========================
  socket.on("chat", (msg) => {
    console.log("message: ",msg)
    socket.emit("isHost",1)
    connections.emit("sendMsg", socket.id, msg);
  });
  // ====================================
  // socket.on("window_close", ()=>{
  //   console.log("cllooosse")
  // })

})

function getProducer(socketId, dataChannel){
  const [producerTransport] = producers.filter(producer => producer.socketId === socketId  && producer.producer.appData.isShareScreen === true)
  return producerTransport.producer
}

const createWebRtcTransport = async (router) => {
  return new Promise(async (resolve, reject) => {
    try {
      // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: '0.0.0.0', // replace with relevant IP address
            announcedIp: '127.0.0.1',
          }
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      }

      // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
      let transport = await router.createWebRtcTransport(webRtcTransport_options)
      console.log(`transport id: ${transport.id}`)

      transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed') {
          transport.close()
        }
      })

      transport.on('close', () => {
        console.log('transport closed')
      })

      resolve(transport)

    } catch (error) {
      reject(error)
    }
  })
}