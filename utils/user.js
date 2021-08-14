const admin = require("firebase-admin");
const db = admin.firestore();

const CyclicManager = require("./cyclic");
const CYCLIC_FUNCTIONS = new CyclicManager();

class UserManager {
	constructor() {
		this.COLLECTION_NAME = "usuarios";
	}

	build_response = (axiosResponse, context) => {
		let status = axiosResponse.status;
		let payload = context == "axios" ? axiosResponse.data : axiosResponse;
		let expected = context == "inner" ? undefined : 200

		if (status == expected) {
			return {
				state: false,
				payload,
				err: {},
				status
			}
		} else
			return {
				state: true,
				payload: {},
				err: payload,
				status
			}
	}

	existe_coleccion = (uid, cb) => {
		var response;

		db.collection(this.COLLECTION_NAME).doc(uid).get()
			.then(doc => {
				if (doc.exists) {
					return cb(this.build_response(doc.data(), "inner"))

				}
				response = {
					state: false,
					payload: {
						exists: false,
					},
					err: {}
				}
				return cb(response);
			})
			.catch(error => {
				response = {
					state: true,
					payload: {},
					err: {
						msg: error
					}
				}
				return cb(response);
			})
	}

	crear_coleccion = (uid, payload, cb) => {
		var response;
		this.existe_coleccion(uid, (response_data) => {
			if (!response_data.state && !response_data.payload.exists) {

				db.collection(this.COLLECTION_NAME).doc(uid).set(payload)
					.then(() => {
						response = {
							state: false,
							payload: {
								msg: "Coleccion creada",
							},
							err: {}
						}
						return cb(response);
					})
					.catch((error) => {
						response = {
							state: true,
							payload: {},
							err: {
								msg: error
							}
						}
						return cb(response);
					});
			} else {
				response = {
					state: true,
					payload: {},
					err: {
						msg: "La colección ya estaba creada",
					}
				}
				return cb(response);

			}
		})
	}

	eliminar_coleccion = (uid, cb) => {
		var response;
		db.collection(this.COLLECTION_NAME).doc(uid).delete()
			.then((_) => {
				response = {
					state: false,
					payload: {
						msg: "Colección eliminada",
					},
					err: {}
				}
				return cb(response);
			})
			.catch((error) => {
				response = {
					state: true,
					payload: {},
					err: {
						msg: error
					}
				}
				return cb(response);
			});
	}

	actualizar_coleccion = (uid, payload, cb) => {
		var response;
		db.collection(this.COLLECTION_NAME).doc(uid).update(payload)
			.then((_) => {
				response = {
					state: false,
					payload: {
						msg: "Coleccion actualizada",
					},
					err: {}
				}
				return cb(response);
			})
			.catch((error) => {
				response = {
					state: true,
					payload: {},
					err: {
						msg: error
					}
				}
				return cb(response);
			});
	}

	agregar_playlist_data = (type, uid, payload, platform, cb) => {
		var response;
		switch (type) {
			case "playlist":
				db.collection(this.COLLECTION_NAME).doc(uid).collection("playlists").doc(payload.id).set(payload)
					.then((response_data) => {
						response = {
							state: false,
							payload: {
								msg: "Playlist agregada",
							},
							err: {}
						}
						return cb(response)
					})
					.catch((error) => {
						response = {
							state: true,
							payload: {},
							err: {
								msg: error
							}
						}
						return cb(response);
					});
				break;
			case "song":
				if (platform == "spotify" || platform == "s") {
					CYCLIC_FUNCTIONS.spotify_get_playlist_by_id(payload.access_token, payload.playlist_id, true, (response_data) => {
						if (!response_data.state) {
							db.collection(this.COLLECTION_NAME).doc(uid).collection("playlists").doc(payload.playlist_id).set({
									songs: response_data.payload.data.items
								})
								.then((_) => {
									response = {
										state: false,
										payload: {
											msg: "Actualizado",
										},
										err: {}
									}
									return cb(response)
								})
								.catch((error) => {
									response = {
										state: true,
										payload: {},
										err: {
											msg: error
										}
									}
									return cb(response);
								});
						} else {
							response = {
								state: true,
								payload: {},
								err: {
									msg: response_data.err.msg
								}
							}
							return cb(response);
						}
					});
				} else if (platform == "youtube" || platform == "y") {
					CYCLIC_FUNCTIONS.youtube_get_playlist_by_id(payload.access_token, ["id", "snippet", "contentDetails"], payload.playlist_id, (response_data) => {
						if (!response_data.state) {
							console.log("syesss")
							db.collection(this.COLLECTION_NAME).doc(uid).collection("playlists").doc(payload.playlist_id).set({
									songs: response_data.payload.items
								})
								.then((_) => {
									response = {
										state: false,
										payload: {
											msg: "Actualizado",
										},
										err: {}
									}
									return cb(response)
								})
								.catch((error) => {
									response = {
										state: true,
										payload: {},
										err: {
											msg: error
										}
									}
									return cb(response);
								});
						} else {
							response = {
								state: true,
								payload: {},
								err: {
									msg: response_data.err.msg
								}
							}
							return cb(response);
						}
					});
				}
				break;

			default:
				response = {
					state: true,
					payload: {},
					err: {
						msg: "Seleccione song o playlist"
					}
				}
				return cb(response);
		}
	}
}



module.exports = UserManager;