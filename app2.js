import express from 'express'
const app2 = express();
// import routes from './routes2.js'
// app2.use('/',routes);
app2.get('/', (req,res)=>{
    res.send({message: 'Hello World 2!'});
    
  });
export default app2;