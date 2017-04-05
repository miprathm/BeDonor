var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var ObjectID = require('mongodb').ObjectID;
var sha1 = require('sha1');
var fs = require('fs');
var config = require('../config');
var uuid = require('node-uuid');
var xslToJson = require("xlsx-to-json");
var md5 = require('md5');
/* GET home page. */
router.use('/', function (req, res, next) {
	//console.log(" Success ");

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];
	// decode token
	if (token) {
		// verifies secret and checks exp
		//console.log(1);
		jwt.verify(token, config.secret, function (err, decoded) {
			if (err) {
				//	console.log(2);
				res.json({
					status : 3,
					message : 'Failed to authenticate token.'
				});
			} else {
				// if everything is good, save to request for use in other routes
				//console.log(3);
				//console.log(' /api ');
				req.decoded = decoded;
				next();
			}
		});
	} else {
		// if there is no token
		// return an error
		res.status(403).send({
			status : 0,
			message : 'No token provided.'
		});
	}
});

router.post('/donor', function (req, res, next) {
	// Is Birthdat request

	// It will firstName
	/*{
	firstName:'',
	lastName:'',
	bloodGroup:'',
	location:''
	}
	bloodGroup
	locationTags
	 */
	//console.log(" Request received >>");
	//console.log(" Request received >> " + JSON.stringify(req.body));
	var donorObj = req.body;
	var queryObj = {};

	donorObj.firstName = (donorObj.firstName) || '';
	donorObj.lastName = (donorObj.lastName) || '';
	donorObj.bloodGroup = (donorObj.bloodGroup) || '';
	donorObj.location = (donorObj.location) || '';
	if (donorObj.bloodGroup === "Any") {
		donorObj.bloodGroup = "";
	}
	// Priority Given As
	// bloodGroup
	// then firstName
	// then lastName
	// then location
	// bloodgroup and location
	// location firstname lastname

	var location = donorObj.location.split(',');

	if (donorObj.bloodGroup != '') {

		if (donorObj.location != '') {
			queryObj = {
				$and : [{
						'bloodGroup' : donorObj.bloodGroup
					}, {
						'locationTags' : {
							$all : location
						}
					}
				]
			};
		} else {
			queryObj = {
				'bloodGroup' : donorObj.bloodGroup
			}
		}

	} else {
		if (donorObj.firstName != '' || donorObj.lastName != '' || donorObj.location != '') {
			queryObj = {
				$or : []
			};

			if (donorObj.firstName != '') {
				queryObj['$or'].push({
					'name.firstName' : donorObj.firstName
				});
			}
			if (donorObj.lastName != '') {
				queryObj['$or'].push({
					'name.firstName' : donorObj.lastName
				});
			}
			if (donorObj.location != '') {
				queryObj['$or'].push({
					'locationTags' : {
						$all : location
					}
				});
			}
			if (queryObj['$or'].length === 1) {
				queryObj = queryObj['$or'][0];
			}

		}

	}

	//console.log(' Donor Query >> ' + JSON.stringify(queryObj));

	var db = req.db;
	db.collection('donor').find(queryObj).toArray(function (err, result) {
		if (err || result.length === 0) {
			res.json({
				status : 0,
				message : 'No Record Found.'
			});
		} else {
			res.json({
				status : 1,
				message : 'Successed.',
				data : result
			});
		}
	});

});

router.post('/update', function (req, res, next) {
	/*
	updates
	remark and
	in future
	lastbloodDonation place date description
	 */
	var remark = req.body.remark || '';
	var donorId = req.body.id || '';

	if (donorId != null && donorId != '' && donorId.length === 24 && remark != '') {
		var db = req.db;
		db.collection('donor').update({
			_id : ObjectID(donorId)
		}, {
			'$push' : {
				'remarks' : {
					$each : [{
							'date' : new Date(),
							'remark' : remark
						}
					],
					$position : 0
				}
			}
		}, function (err, result) {
			if (err) {
				res.json({
					status : 0,
					message : 'No result found.'
				});
			} else {
				res.json({
					status : 1,
					message : 'Successed.'
				});
			}
		});
	} else {
		res.json({
			status : 0,
			message : 'Invalid Input.'
		});
	}

});

router.post('/changepassword', function (req, res, next) {
	var password = req.body.password || '';
	var donorId = req.body.id || '';

	if (donorId != null && donorId != '' && donorId.length === 24 && password != '' /*&& password.length > 20*/
	) {
		var db = req.db;
		//var encriptedPass = sha1(Password);
		//
		db.collection('volenteer').update({
			_id : ObjectID(donorId)
		}, {
			'$set' : {
				'password' : password
			}
		}, function (err, result) {
			if (err) {
				res.json({
					status : 0,
					message : 'No result found.'
				});
			} else {
				res.json({
					status : 1,
					message : 'Successed.'
				});
			}
		});
	} else {
		res.json({
			status : 0,
			message : 'Invalid Input.'
		});
	}
});

router.post('/upload', function (req, res, next) {

	//console.log("In Upload");
	// Get xsl file
	// Save into private file
	// Get Todays date and time to set file Name
	// get that file Convert to Json
	// And Add Entry To User Database


	// xsl - to- json


	//res.render('index', { title: 'Express' });
	/*
	// function to encode file data to base64 encoded string
	function base64_encode(file) {
	// read binary data
	var bitmap = fs.readFileSync(file);
	// convert binary data to base64 encoded string
	return new Buffer(bitmap).toString('base64');
	}

	// function to create file from base64 encoded string
	function base64_decode(base64str, file) {
	// create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
	var bitmap = new Buffer(base64str, 'base64');
	// write buffer to file
	fs.writeFileSync(file, bitmap);
	console.log('******** File created from base64 encoded string ********');
	}
	 */
	if (req.body.upload != null) {
		var db = req.db;
		// Check wether upload is twice
		// first generate md5
		// check it into collection UploadHash
		// if present then return
		// else on completion add into collection

		var generatedHash = md5(req.body.upload);
		//console.log(" Generated "+generatedHash);
		db.collection('UploadHash').findOne({
			hash : generatedHash
		}, function (err, success) {
			//console.log('279 ' + (err ? JSON.stringify(err): 'No e') + (success? JSON.stringify(success):'No s'));
				
			if (!success || err) {
				var filePath = config.allExcelSheetFilePath + uuid.v4() + ".xlsx";
				fs.writeFile(filePath, (new Buffer(req.body.upload, 'base64')), function (err) {
					err ? console.log('filePath :' + filePath + 'Error ' + JSON.stringify(err)) : '';

					if (err)
						return res.json({
							status : 0,
							"message" : "File is Not Write Successfully!"
						});
					xslToJson({
						input : filePath, // input xls
						output : null, //"output.json" // output json
						sheet : null, //"sheetname", // specific sheetname
					}, function (err, result) {
						if (err) {
							return res.json({
								"status" : 0,
								"message" : "Not able to parse json from excel sheet!"
							});
							//console.error(err);
						} else {
							//console.log('Result : '+JSON.stringify(result));
							//return;
							var modifiedRsult = result.map(function (obj) {
									return {
										"name" : {
											"firstName" : obj.FirstName || '',
											"middleName" : obj.MiddleName || '',
											"lastName" : obj.LastName || ''
										},
										"address" : {
											"fullAddress" : obj.Address || '',
											"pinCode" : obj.PinCode || '',
											"country" : obj.Country || 'India',
											"state" : obj.State || 'Maharashtra',
											"city" : obj.City || ''
										},
										"contactDetails" : {
											"mobileNo" : obj.MobileNo || '',
											"resPhone" : obj.ResPhone || '',
											"email" : obj.Email || '',
											"other" : obj.OtherContact ? obj.OtherContact.split(",") : []
										},
										"locationTags" : obj.Location ? obj.Location.split(",") : [obj.City || ''],
										"bloodGroup" : obj.BloodGroup || '',
										"gender" : obj.Gender || '',
										"remark" : [],
										"lastBloodDonation" : [],
										"birthDate" : obj.BirthDate ? new Date(obj.BirthDate) : null,
										"isActive" : 1,
										"isRecoveryActivated" : false,
									};
								});
							//console.log(" modifiedRsult " + JSON.stringify(modifiedRsult));
							//res.json(modifiedRsult);
							db.collection('donor').insert(modifiedRsult, function (err, result) {
								//console.log(' Error '+JSON.stringify(err));
								if (err)
									return res.json({
										"status" : 0,
										"message" : "Not Added into database!"
									});
								if (result) {
									db.collection('UploadHash').insert({
										hash : generatedHash
									}, function () {
										console.log('Added in hash');
									});

									res.json({
										"status" : 1,
										"message" : "Successfully added!"
									});
								}
							});
						}
					});
				});
			} else {
			//console.log('359 ' + (err ? JSON.stringify(err): 'No e') + (success? JSON.stringify(success):'No s'));
				
			//console.log('Already entry');
				res.json({
					"status" : 4,
					"message" : "Successfully added!"
				});
			}

		});

		//console.log("Working");


	}
});

module.exports = router;
