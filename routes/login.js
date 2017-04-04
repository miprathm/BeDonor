var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../config');
/* GET home page. */
router.post('/', function (req, res, next) {
	var db = req.db;
	db.collection('volenteer').findOne({
		username : req.body.username
	}, function (err, user) {

		if (err)
			throw err;

		if (!user) {
			res.json({
				status : 0,
				message : 'Authentication failed. User not found.'
			});
		} else if (user) {

			// check if password matches
			if (user.password != req.body.password) {
				res.json({
					status : 0,
					message : 'Authentication failed. Wrong password.'
				});
			} else {

				console.log(' config.superSecret ' + config.secret);
				// if user is found and password is right
				// create a token
				var token = jwt.sign(user, config.secret, {
						expiresIn : config.tokenExpireTime // expires in 24 hours
					});

				res.json({
					status : 1,
					token : token,
					id : user._id
				});
			}

		}

	});

});

// All required function used for login
// User Login and gets an token in response


module.exports = router;
