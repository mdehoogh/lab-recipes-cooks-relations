// MDH@16DEC2019: copied over from lab-recipes-crud
const path=require('path');

const hbs=require('hbs');

hbs.registerPartials(path.join(__dirname,"views/partials"));
/*
hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});
*/
hbs.registerHelper({
    eq: function (v1, v2) {
        return v1 === v2;
    },
    ne: function (v1, v2) {
        return v1 !== v2;
    },
    lt: function (v1, v2) {
        return v1 < v2;
    },
    gt: function (v1, v2) {
        return v1 > v2;
    },
    lte: function (v1, v2) {
        return v1 <= v2;
    },
    gte: function (v1, v2) {
        return v1 >= v2;
    },
    and: function () {
        return Array.prototype.slice.call(arguments).every(Boolean);
    },
    or: function () {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    }
});

// express server
const BACKEND_SERVER_PORT=3000; // run on same port (in a single Express server instance)
const FRONTEND_SERVER_PORT=3000;

const express = require('express');

/******************************* FRONT END STUFF ***********************************/
const app = express(); // a new server for running the front-end

app.set('view engine','hbs');

app.set('views',path.join(__dirname,'views'));

// tell express where the static content is located
// NOTE I had app.set(express.static,path.join(__dirname,"public")) here but that didn't work, this does
app.use(express.static(path.join(__dirname,"public")));

// with thanks to Piepongwong (see https://github.com/github/fetch/issues/323)

// the front-end server needs this (and not the json() call), it's the other way round for the backend server
// const bodyParser=require('body-parser');
app.use(require('body-parser').urlencoded({extended:true}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// FRONT-END ROUTES

// MDH@16DEC2019: let's restrict access to authorized users only
// 1. ALLOWING FOR SESSIONS (for users that successfully logged in)
const session=require('express-session');
// install session as middleware before anything else
app.use(session({'secret':'keyboard cat','cookie':{}}));

// protecting ALL backend calls with protect
// NOTE the frontend routes are NOT protected BUT they won't show data!!!!
// 2. prevent access using middleware function 
function protect(req,res,next){
	console.log("protect() called ",req.session);
	// next();return;
	// should we redirect to login???? I suppose so
	if(req.session.currentUser){
		console.log("Logged in, so calling next!");
		next(); // i.e. go and access the database for data!!!
	}else
		res.status(403).send({error:"Please login first!"});
}

// connection to our database
const mongoose=require('mongoose');

// ?????? mongoose.Promise=global.Promise;

// NOTE this apparently is how the connect function of mongoose works!!
mongoose.connect("mongodb://localhost/recipeApp",
					{useNewUrlParser: true}
				).then(function(){
							console.log("Successfully connected to the recipeApp database.");
						}
        		).catch(function(err){console.log('Could not connect to the recipeApp. Exiting now...');process.exit();});

// protect calls to fetch data
const backendRouter=require('./ironhack/backendrouter.js')(mongoose);
app.use("/api",require('body-parser').json());
app.use("/api",[protect,backendRouter]); // pass as array?????

// but allow auth calls without requiring authentication (although I guess findAll() and update())
const authRouter=require('./ironhack/authrouter.js')(mongoose);
app.use("/auth",require('body-parser').json());
app.use("/auth",authRouter);

// MDH@17DEC2019: ok, when logged in goto index, otherwise goto login

// it makes sense to keep a list of cooks

// for showing errors
app.get('/error',(req,res)=>{res.render('error',{error:message});});

function sendResError(res,err){
	message=err.message;
    res.redirect('/error');
    /* replacing:
    message=err.message; // remember the error message to show!!
    res.status(404).send({"error":err});
    */
}

// home
app.get('/',(req,res)=>{
	// if we do not have a session allow the user to login, otherwise render index
	if(req.session.currentUser)res.render('index');else res.redirect('/login');}
);

// login get and post routes
app.get('/login',(req,res)=>{res.render('login');});
app.get('/signup',(req,res)=>{res.render('signup');});
// protect-free routes for login
const users=require('./ironhack/controllers/msd.user.controller.js')(mongoose);
// for users it's a little bit different then usual
// we only allow sign up and log in
app.post('/user/signup',users.create,(user,req,res,next)=>{
	if(user){
		res.redirect('/login');
	}else
		sendResError(res,"ERROR: Failed to create a user called '"+req.body.name+".");
});
app.post('/user/login',users.findOneByName,(user,req,res,next)=>{
	console.log("User login!",user);
	if(user){
		req.session.currentUser=user;
		res.redirect('/');
	}else
		sendResError(res,"ERROR: Failed to log you in as "+req.body.name+".");
});

// parse everything from the /user routes as we're expecting json responses!!

/* replacing:
// login or signup posts need to be json body parsed
app.use('/user',require('body-parser').json());
app.post('/user/login',(req,res)=>{
	console.log("Login user data",req.body);
	let userData=JSON.stringify(req.body);
	fetch('http://localhost:'+BACKEND_SERVER_PORT+"/auth/users/login",
		{method:'post',
		headers:{'Accept': 'application/json','Content-Type': 'application/json'},
		body: userData}
	).then((response)=>{
		let json=response.json();
		console.log("Login json: "+json);
		return json;
	} // don't forget this!!!!
	).then((user)=>{
			console.log("Login succeeded as ",user);
			req.session.currentUser=user;
			console.log("Current user session ",req.session);
			res.render('index'); // we can make it easy on ourselves by rendering index!!!
		}
	).catch((err)=>sendResError(res,err));
});

app.get('/signup',(req,res)=>{res.render('signup');});

app.post('/user/signup',(req,res)=>{
	let newUser=JSON.stringify(req.body);
	fetch('http://localhost:'+BACKEND_SERVER_PORT+"/auth/users",
		{method:'post',
		headers:{'Accept': 'application/json','Content-Type': 'application/json'},
		body: newUser}
	).then((response)=>{
			let json=response.json();
			console.log("Login json: "+json);
			return json;
		} // don't forget this!!!!
	).then((user)=>{
			res.render('index'); // we can make it easy on ourselves by rendering index!!!
		}
	).catch((err)=>sendResError(res,err));
});

// app.get('/', function(req, res){res.render('index');});
*/

// following all routes we need to protect

// const fetch=require('node-fetch'); // so we can use fetch()
var message=null;

// COOK ROUTES
var rememberedCooks=null;
const cooks=require('./ironhack/controllers/msd.cook.controller.js')(mongoose);
function getCooks(){
	// if the cooks are available return them immediately
	if(rememberedCooks)return Promise.resolve(rememberedCooks);
	let Cook=require('./ironhack/models/msd.cook.model.js')(mongoose);
	return Cook.find({}); // will be thenable (although as far as I understood not a Promise theoretically)
}
app.get('/cooks',protect,cooks.findAll,
			(cooks,req,res,next)=>{
				rememberedCooks=(cooks?cooks.sort(function(a,b){return(a.name>b.name?1:-1);}):null);
				if(rememberedCooks)
					res.render('cooks',{cooks:rememberedCooks});
				else
					sendResError(res,"ERROR: Failed to retrieve all cooks.");
			}
		);

// 2. Editing a cook
app.get('/cook/:cookId/edit',protect,cooks.findOne,
		(cook,req,res,next)=>{
			if(cook)res.render('cookedit',{cook:cook});
			else sendResError(res,"ERROR: Failed to obtain the cook with id "+req.params.cookId+" to edit.");
	}
);

// 3. Showing a single cook (detailed)
app.get('/cooks/:cookId',protect,cooks.findOne,
			(cook,req,res,next)=>{
                if(cook)res.render('cookdetails',{cook:cook});
				else sendResError(res,"ERROR: Failed to obtain the cook with id "+req.params.cookId+" to show.");
			}
		);

// 4. Create a new cook
app.get('/cook/new',(req,res)=>{message=null;res.render('cooknew');});

// 5. Store a cook
// NOTE stringifying the body definitely required, as well as the headers part (verified)
app.post('/cook/new',protect,cooks.create,(data,req,res,next)=>{
                    if(data){
						rememberedCooks=null;
						res.redirect('/cooks');
					}else sendResError(res,"ERROR: Failed to create a new cook.");
			}
		);

// Update a cook
app.post('/cook/update',protect,cooks.update,
			(cook,req,res,next)=>{
                if(cook)res.redirect('/cooks'); // show the cook again
				else sendResError(res,"ERROR: Failed to update a cook.");
			}
		);

// Delete a cook
app.get('/cook/:cookId/delete',protect,cooks.delete,
			(data,req,res,next)=>{
				if(data){
					rememberedCooks=null;
                    res.redirect('/cooks');
                } else sendResError(res,"ERROR: Failed to delete the cook.");
		}
);

// RECIPE ROUTES
const recipes=require('./ironhack/controllers/msd.recipe.controller.js')(mongoose);
// 1. Showing all recipes
app.get('/recipes',protect,recipes.findAll,
					(recipes,req,res,next)=>{
						if(recipes){
							console.log("Received recipes: ",recipes);
							// show sorted on by title
							sortedRecipes={recipes:recipes.sort(function(a,b){return(a.title>b.title?1:-1);})};
							if(message)sortedRecipes.message=message; // have we got a message to show????
							res.render('recipes',sortedRecipes);
						}else sendResError(res,"ERROR: Failed to retrieve the recipes.");
					}
		);

// 2. Editing a recipe
app.get('/recipe/:recipeId/edit',protect,recipes.findOne,
		(recipe,req,res,next)=>{
			if(recipe){
				// as soon as we have the cooks we're good to go
				getCooks().then((cooks)=>{
					if(cooks)res.render('recipeedit',{recipe:recipe,cooks:cooks});
					else sendResError(res,"ERROR: Failed to obtain the cooks for use in editing a recipe.");
				})
			}else sendResError(res,"ERROR: Failed to obtain the recipe for editing.");
	}
);

// 3. Showing a single recipe (detailed)
app.get('/recipes/:recipeId',protect,
			(recipe,req,res,next)=>{
				if(recipe)res.render('recipedetails',{recipe:recipe});
				else sendResError(res,"ERROR: Failed to obtain the recipe with id "+req.params.recipeId);
			}
		);

// 4. Create a new recipe
app.get('/recipe/new',protect,
			(req,res)=>{
                message=null;
                // in this case now I need to pass in all the cooks as well
				getCooks()
					.then((cooks)=>{
							console.log("Received cooks: ",cooks);
							// show sorted on by title
							sortedCooks={cooks:cooks.sort(function(a,b){return(a.name>b.name?1:-1);})};
							if(message)sortedCooks.message=message; // have we got a message to show????
							res.render('recipenew',sortedCooks);
						})
					.catch(err=>sendResError(res,err));
			}
		);

// 5. Store a recipe
// NOTE stringifying the body definitely required, as well as the headers part (verified)
app.post('/recipe/new',protect,recipes.create,
			(recipe,req,res,next)=>{
				if(data)res.redirect('/recipes'); // show the recipes again
				else sendResError(res,"ERROR: Failed to create the recipe.");
			}
		);

// Update a recipe
app.post('/recipe/:recipeId/update',protect,recipes.update,
			(recipe,req,res,next)=>{
				if(recipe)res.redirect('/recipes');
				else sendResError(res,"ERROR: Failed to update the recipe.");
			}
		);		

// Delete a recipe
app.get('/recipe/:recipeId/delete',protect,recipes.delete,
			(recipe,req,res,next)=>{
                if(recipe)res.redirect('/recipes'); // show the recipes again
				else sendResError(res,"ERROR: Failed to delete the recipe.");
			}
);

/**************************** RUN THE SERVERS **********************************************/
// Run the frontend server
app.listen(FRONTEND_SERVER_PORT,()=>{console.log("Server is listening on port "+FRONTEND_SERVER_PORT+".");});



