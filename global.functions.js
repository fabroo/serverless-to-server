require("dotenv").config();
const globalRouter = require("express").Router()

const AUTH = require("./utils/auth")
const UserManager = require('./utils/user');

const COLLECTION = new UserManager();
const cors = require('cors')({
	origin: true
});

const BeckTestManager = require('./utils/beck');
const BECK = new BeckTestManager();

globalRouter.get('/getCollection', async (req, res) =>{
	let token = req.headers.authorization_token;

	AUTH.validate_token(token, async (response) => {
		if (!response.payload.authenticated) {
			return res.status(401).json(response)
		}

		let uid = response.payload.decodedToken.uid;
		let payload = req.body.payload;

		COLLECTION.existe_coleccion(uid, (response) => {
			return res.status(200).json(response)
		})
	})
});

// exports.handleUserCollections = functions.https.onRequest(async (req, res) => {
// 	cors(req, res, async () => {
// 		let token = req.headers.authorization_token;

// 		AUTH.validate_token(token, async (response) => {
// 			if (!response.payload.authenticated) {
// 				return res.status(401).json(response)
// 			}

// 			let uid = response.payload.decodedToken.uid;
// 			let payload = req.body.payload;

// 			switch (req.method) {
// 				case "GET":
// 					COLLECTION.existe_coleccion(uid, (response) => {
// 						return res.status(200).json(response)
// 					})
// 					break;

// 				case "POST":
// 					COLLECTION.crear_coleccion(uid, payload, (response) => {
// 						return res.status(200).json(response)
// 					})
// 					break;

// 				case "PUT":
// 					COLLECTION.actualizar_coleccion(uid, payload, (response) => {
// 						return res.status(200).json(response)
// 					})
// 					break;

// 				case "DELETE":
// 					COLLECTION.eliminar_coleccion(uid, (response) => {
// 						return res.status(200).json(response)
// 					})
// 					break;
// 				default:
// 					var response;
// 					response = {
// 						state: true,
// 						payload: {},
// 						err: {
// 							msg: "Method not allowed"
// 						}
// 					}
// 					return res.status(404).json(response)
// 			}

// 		});
// 	})
// })

// exports.handleTests = functions.https.onRequest(async (req, res) => {
// 	cors(req, res, async () => {
// 		let token = req.headers.authorization_token;

// 		AUTH.validate_token(token, async (response) => {
// 			if (!response.payload.authenticated) {
// 				return res.status(401).json(response)
// 			}

// 			let uid = response.payload.decodedToken.uid;
// 			let payload = req.body.payload;

// 			switch (req.method) {
// 				case "GET":
// 					await BECK.generate_test(uid, (response) => {
// 						return res.status(200).json(response)
// 					})
// 					break;

// 				case "POST":
// 					BECK.post_test(uid, payload, (response) => {
// 						return res.status(200).json(response)
// 					})
// 					break;

// 				default:
// 					var response;
// 					response = {
// 						state: true,
// 						payload: {},
// 						err: {
// 							msg: "Method not allowed"
// 						}
// 					}
// 					return res.status(404).json(response)
// 			}

// 		});
// 	})
// })