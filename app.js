const express = require('express');
const bodyparser = require('body-parser');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config()

const MONGODB_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 4173;

app = express();

app.use(bodyparser.urlencoded({extended:false}))

mongoose.connect(MONGODB_URI)
    .then((result)=>{
        app.listen(PORT,()=>{
            console.log("Server started at port no. ", PORT,"...");
        })
    })
    .catch((err)=>console.log(err));