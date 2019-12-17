// backend stuff

const express=require('express');

// MDH@16DEC2019: with a single web server we stick to create router here (not an explicit server)

/////////backendserver.use(bodyParser.urlencoded({extended:true}));

module.exports=(conn)=>{
	const backendrouter=express.Router(); // replacing: express()
	backendrouter.use(require('body-parser').json()); // the backend server needs this
	// connect all the backend server routes, passing in the backend server and the connection
	require('./routes/msd.recipe.routes.js')(backendrouter,conn);
	// MDH@16DEC2019: get in the cook routes as well!!!!
	require('./routes/msd.cook.routes.js')(backendrouter,conn);
	return backendrouter;
}