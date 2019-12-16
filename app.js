// MDH@16DEC2019: copied over from lab-recipes-crud

const BACKEND_SERVER_PORT=2995;
const FRONTEND_SERVER_PORT=3005;

const express = require('express');

/******************************* BACK END STUFF ************************************/
const backendserver=express();

const mongoose=require('mongoose');

// ?????? mongoose.Promise=global.Promise;

// NOTE this apparently is how the connect function of mongoose works!!
mongoose.connect("mongodb://localhost/recipeApp",
					{useNewUrlParser: true}
				).then(function(){
							console.log("Successfully connected to the recipeApp database.");
						}
        		).catch(function(err){console.log('Could not connect to the recipeApp. Exiting now...');process.exit();});

/////////backendserver.use(bodyParser.urlencoded({extended:true}));
backendserver.use(require('body-parser').json()); // the backend server needs this

// connect all the backend server routes, passing in the backend server and the connection
require(__dirname+'/ironhack/routes/msd.recipe.routes.js')(backendserver,mongoose);
// MDH@16DEC2019: get in the cook routes as well!!!!
require(__dirname+'/ironhack/routes/msd.cook.routes.js')(backendserver,mongoose);

// make the backend server listen on port 2999
backendserver.listen(BACKEND_SERVER_PORT,()=>{console.log("Backend server is listening on port "+BACKEND_SERVER_PORT+".");});

/******************************* FRONT END STUFF ***********************************/
const app = express(); // a new server for running the front-end

const hbs=require('hbs');
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

const path=require('path');

app.set('view engine','hbs');

app.set('views',path.join(__dirname,'views'));

hbs.registerPartials(path.join(__dirname,"views/partials"));

// tell express where the static content is located
// NOTE I had app.set(express.static,path.join(__dirname,"public")) here but that didn't work, this does
app.use(express.static(path.join(__dirname,"public")));

// with thanks to Piepongwong (see https://github.com/github/fetch/issues/323)

// the front-end server needs this (and not the json() call), it's the other way round for the backend server
app.use(require('body-parser').urlencoded({extended:true})); // ???????
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });

// FRONT-END ROUTES
app.get('/', function(req, res){
    res.render('index');
});

// show a message on the same page
function showMessage(message){document.getElementById("message").innerHTML=message;}

// it makes sense to keep a list of cooks
var cooks=null;
function getCooks(){
    // if the cooks are available return them immediately
    if(cooks)return Promise.resolve(cooks);
    message=null;
    // if not, return the Promise that will get them (and store them)
    return fetch('http://localhost:'+BACKEND_SERVER_PORT+"/cooks")
            .then((response)=>{return response.json();})
            .then((cookDocuments)=>{
                console.log("Cooks retrieved from database: ",cookDocuments);
                return(cooks=cookDocuments);
            });
}

function sendResError(res,err){
    showMessage(err.message);
    /* replacing:
    message=err.message; // remember the error message to show!!
    res.status(404).send({"error":err});
    */
}

const fetch=require('node-fetch'); // so we can use fetch()

// RECIPE ROUTES
// 1. Showing all recipes
app.get('/recipes',
			(req,res)=>{
                message=null;
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/recipes")
					.then((response)=>{return response.json();})
					.then(
						(recipes)=>{
							console.log("Received recipes: ",recipes);
							// show sorted on by title
							sortedRecipes={recipes:recipes.sort(function(a,b){return(a.title>b.title?1:-1);})};
							if(message)sortedRecipes.message=message; // have we got a message to show????
							res.render('recipes',sortedRecipes);
						})
					.catch(err=>sendResError(res,err));
			}
		);

// 2. Editing a recipe
app.get('/recipe/:recipeId/edit',
		(req,res)=>{
            message=null;
            // we need cooks to do this
            getCooks().then((cooks)=>{
                fetch('http://localhost:'+BACKEND_SERVER_PORT+"/recipes/"+req.params.recipeId)
                .then((response)=>{return response.json();})
                .then((recipe)=>{
                        console.log("Received recipe: ",recipe);
                        res.render('recipeedit',{recipe:recipe,cooks:cooks});
                    })
                .catch(err=>sendResError(res,err));
            }).catch(err=>sendResError(res,err));
	}
);

// 3. Showing a single recipe (detailed)
app.get('/recipes/:recipeId',
			(req,res)=>{
                message=null;
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/recipes/"+req.params.recipeId)
					.then((response)=>{return response.json();})
					.then(
						(recipe)=>{
							//////console.log("Received recipe: ",recipe);
							res.render('recipedetails',{recipe:recipe});
						})
					.catch(err=>sendResError(res,err));
			}
		);

// 4. Create a new recipe
app.get('/recipe/new',
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
app.post('/recipe/new',
			(req,res)=>{
                message=null;
                /////////req.body.creator=mongoose.Types.ObjectId(req.body.creator); // will this work?????
				let newRecipe=JSON.stringify(req.body);
				console.log("New recipe: ",newRecipe);
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/recipes",
					{method:'post',
					 headers:{'Accept': 'application/json','Content-Type': 'application/json'},
					 body: newRecipe}
					)
				.then((response)=>{return response.json();})
				.then((data)=>{
						console.log("Received new recipe data: ",data);
						res.redirect('/recipes'); // show the recipes again
					})
				.catch(err=>sendResError(res,err));
			}
		);

// Update a recipe
app.post('/recipe/update',
			(req,res)=>{
                message=null;
				let recipeId=req.query._id;
				console.log("Recipe '"+recipeId+"' update: ",req.body);
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/recipes/"+recipeId,
					{method:'put',
					headers:{'Accept': 'application/json','Content-Type': 'application/json'},
					body:JSON.stringify(req.body)
					})
				.then((response)=>{return response.json();})
				.then((updatedRecipe)=>{
                        console.log("Recipe after update: ",updatedRecipe);
                        res.redirect('/recipes');
						// replacing: res.redirect('/recipedetails',{recipe:updatedRecipe.updated}); // show the recipes again
					})
				.catch(err=>sendResError(res,err));
			}
		);		

// Delete a recipe
app.get('/recipe/:recipeId/delete',
			(req,res)=>{
                message=null;
				console.log("Deleting the recipe with id '"+req.params.recipeId+"'.");
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/recipes/"+req.params.recipeId,{method:'delete'})
				.then((response)=>{return response.json();})
				.then((data)=>{
						message=data.message;
						res.redirect('/recipes'); // show the recipes again
					})
				.catch(err=>sendResError(res,err));
		}
);

// COOK ROUTES
// 1. Showing all recipes
app.get('/cooks',
			(req,res)=>{
                message=null;
				getCooks()
					.then((cooks)=>{
							console.log("Received cooks: ",cooks);
							// show sorted on by title
							data={cooks:cooks.sort(function(a,b){return(a.name>b.name?1:-1);})};
							if(message)data.message=message; // have we got a message to show????
							res.render('cooks',data);
						})
					.catch(err=>sendResError(res,err));
			}
		);

// 2. Editing a cook
app.get('/cook/:cookId/edit',
		(req,res)=>{
            message=null;
			fetch('http://localhost:'+BACKEND_SERVER_PORT+"/cooks/"+req.params.cookId)
			.then((response)=>{return response.json();})
			.then((cook)=>{
					console.log("Received cook: ",cook);
					res.render('cookedit',{cook:cook});
				})
			.catch(err=>sendResError(res,err));
	}
);

// 3. Showing a single cook (detailed)
app.get('/cooks/:cookId',
			(req,res)=>{
                message=null;
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/cooks/"+req.params.cookId)
                .then((response)=>{return response.json();})
                .then((cook)=>{
                        //////console.log("Received cook: ",cook);
                        res.render('cookdetails',{cook:cook});
                    })
                .catch(err=>sendResError(res,err));
			}
		);

// 4. Create a new cook
app.get('/cook/new',(req,res)=>{message=null;res.render('cooknew');});

// 5. Store a cook
// NOTE stringifying the body definitely required, as well as the headers part (verified)
app.post('/cook/new',(req,res)=>{
                message=null;
				let newCook=JSON.stringify(req.body);
				console.log("New cook: ",newCook);
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/cooks",
					{method:'post',
					 headers:{'Accept': 'application/json','Content-Type': 'application/json'},
					 body: newCook}
					)
				.then((response)=>{return response.json();})
				.then((data)=>{
                        console.log("Received new cook data: ",data);
                        cooks=null; // get rid of the remembered cooks
						res.redirect('/cooks'); // show the cooks again
					})
				.catch(err=>sendResError(res,err));
			}
		);

// Update a cook
app.post('/cook/update',
			(req,res)=>{
                message=null;
				let cookId=req.query._id;
				console.log("Cook '"+cookId+"' update: ",req.body);
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/cooks/"+cookId,
					{method:'put',
					headers:{'Accept': 'application/json','Content-Type': 'application/json'},
					body:JSON.stringify(req.body)
					})
				.then((response)=>{return response.json();})
				.then((updatedCook)=>{
                        cooks=null;
						/////////console.log("Recipe after update: ",recipe);
						res.redirect('/cooks'); // show the cook again
					})
				.catch(err=>sendResError(res,err));
			}
		);

// Delete a cook
app.get('/cook/:cookId/delete',
			(req,res)=>{
                message=null;
				console.log("Deleting the cook with id '"+req.params.recipeId+"'.");
				fetch('http://localhost:'+BACKEND_SERVER_PORT+"/cooks/"+req.params.cookId,{method:'delete'})
				.then((response)=>{return response.json();})
				.then((data)=>{
                    message=data.message;
                    cooks=null;
                    res.redirect('/cooks');
                }).catch(err=>sendResError(res,err));
		}
);

// Run the frontend server
app.listen(FRONTEND_SERVER_PORT,()=>{console.log("Front-end server is listening on port "+FRONTEND_SERVER_PORT+".");});



