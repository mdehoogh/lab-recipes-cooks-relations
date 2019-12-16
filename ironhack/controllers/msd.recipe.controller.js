/*
 * Generated by: Mongoose Schema Designer
 * At: 16 december 2019
 * Author: Marc P. de Hoogh
 */
module.exports=(conn)=>{ // requires plugging in the connection to use for creating models
	const Recipe=require('../models/msd.recipe.model.js')(conn?conn:require('mongoose'));
	return{
		create:function(req,res,next){
			// Step 1. if not all required fields are present, return appropriate error message.
			if(!req.body.level||!req.body.cuisine)
				return res.status(400).send({error:'Not all required input fields to create a Recipe document specified.'});
			
			// Step 2. Create a new object with the received data (properties of reg.body));
			var recipeData={
				level:req.body['level'],
				cuisine:req.body['cuisine'],
			};
			if(req.body.hasOwnProperty('title'))if(req.body['title'])recipeData['title']=req.body['title'];
			if(req.body.hasOwnProperty('ingredients'))if(req.body['ingredients'])recipeData['ingredients']=req.body['ingredients'];
			if(req.body.hasOwnProperty('dishType'))if(req.body['dishType'])recipeData['dishType']=req.body['dishType'];
			if(req.body.hasOwnProperty('image'))if(req.body['image'])recipeData['image']=req.body['image'];
			if(req.body.hasOwnProperty('duration'))if(req.body['duration'])recipeData['duration']=req.body['duration'];
			if(req.body.hasOwnProperty('creator'))if(req.body['creator'])recipeData['creator']=req.body['creator'];
			if(req.body.hasOwnProperty('created'))if(req.body['created'])recipeData['created']=req.body['created'];
			const recipe=new Recipe(recipeData);
			// Step 3. Save the newly created instance
			recipe.save().then(data=>{
				res.send(data); // or whatever else you want to send
			}).catch(err=>{
				res.status(500).send({
					error:err.message||'Some error occurred trying to add a recipe'
				});
			});
		},
		findAll:function(req,res,next){
			// MDH@16DEC2019: let's see what happens if I use populate on the creator reference!!
			Recipe.find({})
			.then(recipes => {
				res.send(recipes);
			}).catch(err => {
				res.status(500).send({
					error: err.message || 'Some error occurred while retrieving recipes.'
				});
			});
		},
		findOne:function(req,res,next){
			// when showing details, let's populate the creator!!!!
			Recipe.findById(req.params.recipeId)
			.populate("creator")
			.then(recipe => {
				if(!recipe){
					return res.status(404).send({
						error: 'Recipe with id ' + req.params.recipeId + ' not found.'
					});
				}
				res.send(recipe);
			}).catch(err => {
				if(err.kind=='ObjectId'){
					return res.status(404).send({
						error: 'Client with id ' + req.params.recipeId + ' not found.'
					});
				}
				return res.status(500).send({
					error: 'Failed to retrieve the recipe with id ' + req.params.recipeId + '.'
				});
			});
		},
		update:function(req,res,next){
			Recipe.findOneAndUpdate({_id:req.params.recipeId},{$set:req.body},{new:true})
			.then(recipe => {
				if(!recipe){
					return res.status(400).send({
						error:'Recipe with id ' + req.params.recipeId + 'not found.'
					});
				}
				res.send({'updated':recipe});
			}).catch(err => {
				if(err.kind == 'ObjectId'){
					return res.send(404).send({
						error: 'recipe with id ' + req.params.recipeId + ' not found.'
					});
				}
				return res.status(500).send({
					body: req.body,
					error: 'Failed to update the recipe with id ' + req.params.recipeId + '.'
				});
			});
		},
		delete:function(req,res,next){
			Recipe.findOneAndDelete({_id:req.params.recipeId})
			.then(recipe => {
				if(!recipe){
					return res.status(400).send({
						error: 'Recipe with id ' + req.params.recipeId + 'not found.'
					});
				}
				res.send({message:'recipe deleted successfully.'});
			}).catch(err => {
				if(err.kind == 'ObjectId'||err.name=='NotFound'){
					return res.send(404).send({
						error: 'recipe with id ' + req.params.recipeId + ' not found.'
					});
				}
				return res.status(500).send({
					body: req.body,
					error: 'Failed to delete the recipe with id ' + req.params.recipeId + '.'
				});
			});
		},
	};
}