/*
 * Generated by: Mongoose Schema Designer
 * At: 16 december 2019
 * Author: Marc de Hoogh
 */
module.exports=(conn)=>{ // requires plugging in the connection to use for creating models
	const Cook=require('../models/msd.cook.model.js')(conn?conn:require('mongoose'));
	return{
		create:function(req,res,next){
			// Step 1. if not all required fields are present, return appropriate error message.
			
			// Step 2. Create a new object with the received data (properties of reg.body));
			var cookData={};
			if(req.body.hasOwnProperty('name'))if(req.body['name'])cookData['name']=req.body['name'];
			if(req.body.hasOwnProperty('image'))if(req.body['image'])cookData['image']=req.body['image'];
			const cook=new Cook(cookData);
			// Step 3. Save the newly created instance
			cook.save().then(data=>{
				res.send(data); // or whatever else you want to send
			}).catch(err=>{
				res.status(500).send({
					error:err.message||'Some error occurred trying to add a cook'
				});
			});
		},
		findAll:function(req,res,next){
			Cook.find({})
			.then(cooks => {
				res.send(cooks);
			}).catch(err => {
				res.status(500).send({
					error: err.message || 'Some error occurred while retrieving cooks.'
				});
			});
		},
		findOne:function(req,res,next){
			Cook.findById(req.params.cookId)
			.then(cook => {
				if(!cook){
					return res.status(404).send({
						error: 'Cook with id ' + req.params.cookId + ' not found.'
					});
				}
				res.send(cook);
			}).catch(err => {
				if(err.kind=='ObjectId'){
					return res.status(404).send({
						error: 'Client with id ' + req.params.cookId + ' not found.'
					});
				}
				return res.status(500).send({
					error: 'Failed to retrieve the cook with id ' + req.params.cookId + '.'
				});
			});
		},
		update:function(req,res,next){
			Cook.findOneAndUpdate({_id:req.params.cookId},{$set:req.body},{new:true})
			.then(cook => {
				if(!cook){
					return res.status(400).send({
						error:'Cook with id ' + req.params.cookId + 'not found.'
					});
				}
				res.send({'updated':cook});
			}).catch(err => {
				if(err.kind == 'ObjectId'){
					return res.send(404).send({
						error: 'cook with id ' + req.params.cookId + ' not found.'
					});
				}
				return res.status(500).send({
					body: req.body,
					error: 'Failed to update the cook with id ' + req.params.cookId + '.'
				});
			});
		},
		delete:function(req,res,next){
			Cook.findOneAndDelete({_id:req.params.cookId})
			.then(cook => {
				if(!cook){
					return res.status(400).send({
						error: 'Cook with id ' + req.params.cookId + 'not found.'
					});
				}
				res.send({message:'cook deleted successfully.'});
			}).catch(err => {
				if(err.kind == 'ObjectId'||err.name=='NotFound'){
					return res.send(404).send({
						error: 'cook with id ' + req.params.cookId + ' not found.'
					});
				}
				return res.status(500).send({
					body: req.body,
					error: 'Failed to delete the cook with id ' + req.params.cookId + '.'
				});
			});
		},
	};
}