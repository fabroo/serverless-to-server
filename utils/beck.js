const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const db = admin.firestore();
const axios = require("axios");
const UserManager = require('./user');
const COLLECTION = new UserManager();

class BeckTest {
	constructor() {
		this.path = path.resolve(__dirname, '../assets/beck.json')
		this.COLLECTION_NAME = "usuarios";
	}

	build_response = (data) => {
		return {
			state: false,
			payload: data,
			err: {}
		}
	}

	get_user_data = async (uid) => {
		let res = await db.collection(this.COLLECTION_NAME).doc(uid).get()
		if (res.exists) {
			let {
				beck_test_info
			} = res.data()
			return {
				error: false,
				beck_test_info
			}
		} else {
			return {
				error: true
			}
		}
	}

	generate_test = async (uid, cb) => {
		let file = JSON.parse(fs.readFileSync(this.path, 'utf8'))["preguntas"]
		//replace with real sets of questions
		let sets = [
			[1, 3, 5, 7, 9, 15, 13],
			[2, 3, 5, 7, 9, 15, 13],
			[3, 6, 5, 7, 9, 15, 13],
			[4, 3, 5, 7, 9, 15, 13],
			[5, 3, 1, 7, 9, 15, 13],
			[6, 3, 5, 7, 9, 15, 13],
		]

		await COLLECTION.existe_coleccion(uid, async (response) => {
			if (!response.state) {
				let {
					beck_test_info
				} = response.payload;
				let test_history = beck_test_info.test_history;
				let test_feed = beck_test_info.test_feed;

				// POR USUARIO HAY UN ARRAY DE SETS, ESTO LO QUE HACE ES AGARRA DE LOS
				// SETS GENERALES EL INDEX DEL QUE LE SIGUE DE SU ARRAY

				let idx = ((test_history.length) % test_feed.length)
				let new_set_index = sets[test_feed[idx] - 1];
				let beck_test = {}

				for (var question of new_set_index) {
					beck_test[`pregunta_${question}`] = file[`pregunta_${question}`]
				}

				return cb(this.build_response(beck_test))
			}
		})

	}


	post_test = async (uid, payload, cb) => {
		//PREDICT MODELO CON LA PAYLOAD
		//GENERAR PLAYLIST CON LA PREDICCION
		await COLLECTION.existe_coleccion(uid, async (response) => {
			if (!response.state) {
				let {
					beck_test_info
				} = response.payload;

				// aca basicamente recibimos las respuestas y tenemos que mandarlo al modelo para que prediga
				// la suma total y despues agregarla al historial

				// let prediction = await axios.post("https://us-central1-moodsic-proyecto.cloudfunctions.net/test_model", {
				//     payload
				// })

				let prediction = Math.floor(Math.random() * 160);

				beck_test_info.test_history.push(prediction);

				await COLLECTION.actualizar_coleccion(uid, {
					beck_test_info
				}, (response) => {
					return cb(this.build_response({
						msg: "to be continued",
						respuestas: payload
					}));
				})

			}
		})
	}
}

test = new BeckTest()
module.exports = BeckTest;