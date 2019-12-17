// for authorized users only
const express=require('express');

const app=express.Router();

// install on all routes 
app.use(protect);



//                as soon as the login is successful we're going to show 'index'

module.exports=app;
