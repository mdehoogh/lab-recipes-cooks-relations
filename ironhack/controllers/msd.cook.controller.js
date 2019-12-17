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
				next(data,req,res,null);
			}).catch(err=>{
				next(null,req,res,null);
			});
		},
		findAll:function(req,res,next){
			Cook.find({})
			.then(cooks => {
				next(cooks,req,res,null);
			}).catch(err => {
				next(null,req,res,null);
			});
		},
		findOne:function(req,res,next){
			Cook.findById(req.params.cookId)
			.then(cook => {
				next(cook,req,res,null);
			}).catch(err => {
				next(null,req,res,null);
			});
		},
		update:function(req,res,next){
			Cook.findOneAndUpdate({_id:req.params.cookId},{$set:req.body},{new:true})
			.then(cook => {
				next(cook,req,res,null);
			}).catch(err => {
				next(null,req,res,null);
			});
		},
		delete:function(req,res,next){
			Cook.findOneAndDelete({_id:req.params.cookId})
			.then(cook => {
				next(cook,req,res,null);
			}).catch(err => {
				next(null,req,res,null);
			});
		},
	};
}
