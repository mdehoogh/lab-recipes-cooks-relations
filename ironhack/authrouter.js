const express=require('express');

module.exports=(conn)=>{
    const authRouter=express.Router();
    // MDH@17DEC2019: for authentication stuff (well of the backend)
    require('./routes/msd.user.routes.js')(authRouter,conn);
    return authRouter;
}