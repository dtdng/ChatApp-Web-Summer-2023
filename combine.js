// 'use strict';
import app from './app3.js'
// import app2 from './app2.js'

import httpsServer from './app.js'
app.listen(4000, () => {
    console.log(`API REST running in http://localhost:${4000}`);
});

httpsServer.listen(3000, () => {
  console.log('listening on port: ' + 3000)
})



