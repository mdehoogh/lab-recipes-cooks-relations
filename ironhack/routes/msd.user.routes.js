/*
 * Generated by: Office Vitae Mongoose Schema Designer
 * At: 17 december 2019
 * Author: Marc P. de Hoogh
 */
module.exports=(router,conn)=>{
	const users=require('../controllers/msd.user.controller.js')(conn);
	// for users it's a little bit different
	router.post('/users',users.create);
	router.post('/users/login',users.findOneByName);
	// router.get('/users',users.findAll);
	// router.get('/users/:userId',users.findOne);
	// router.put('/users/:userId',users.update);
	// router.delete('/users/:userId',users.delete);
}