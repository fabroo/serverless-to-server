require("dotenv").config();
const functions = require("firebase-functions");
const cors = require('cors')({
	origin: true
});

const AUTH = require("./utils/auth")

// const spotify_redirect_uri = 'http://localhost:5001/moodsic-proyecto/us-central1/spotify-callback';
const spotify_redirect_uri = 'https://us-central1-moodsic-proyecto.cloudfunctions.net/spotify-callback';

const SpotifyManager = require("./utils/spotify")
const SPOTIFY = new SpotifyManager(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, spotify_redirect_uri);

/*
* not a function *
exports.getUserInfo = functions.https.onRequest( (req, res) => {
    SPOTIFY.get_data(req.headers.access_token, (response) => {
        return res.json(response)
    })
})
*/

//handle delete playlist
//change GET to get playlist by id
exports.handlePlaylists = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			let access_token = req.headers.access_token;
			let {
				payload,
				spotify_id
			} = req.body;
			let {
				playlist_id,
				only_ids
			} = req.query;


			let uid = response.payload.decodedToken.uid;
			switch (req.method) {
				case "GET":
					SPOTIFY.get_playlists(access_token, (response) => {
						return res.status(200).json(response)
					})
					break;

				case "POST":
					SPOTIFY.create_playlist(uid, payload, access_token, spotify_id, (response) => {
						return res.status(200).json(response)
					})
					break;

					// case "PUT":
					//     SPOTIFY.update_playlist(uid, payload, data => {
					//         return res.json({ data })
					//     })
					//     break;

					// case "DELETE":
					//     SPOTIFY.delete_playlist(uid, data => {
					//         console.log("ccc")
					//         return res.json({ data })
					//     })
					break;
				default:
					return res.status(404).send("Method not found")
			}
		});
	})
})

exports.refreshToken = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			var refresh_token = req.headers.refresh_token;

			SPOTIFY.refresh_token(refresh_token, response.payload.decodedToken.uid, (response) => {
				return res.json(response)
			})
		});

	})
})

exports.callback = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let {
			code,
			state
		} = req.query


		AUTH.validate_token(state, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			await SPOTIFY.get_credentials(code, response.payload.decodedToken.uid, (response) => {
				
                if(!response.state){
                    return res.status(200).sendFile('./assets/success.html', {root: __dirname })
                }
                else {
                    return res.status(200).sendFile('./assets/error.html', {root: __dirname })
                }
			})

		});

	})
});

//not a function
exports.userLikes = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let token = req.headers.authorization_token;

		let {
			access_token
		} = req.headers;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			await SPOTIFY.get_tops_by_type(access_token, "artists", (response) => {
				return res.status(200).json(response)
			})

		});

	})
});

exports.userFeatures = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			let access_token = req.headers.access_token;
			let playlist_id = req.query.playlist_id;

			SPOTIFY.get_playlist_tracks_features(access_token, playlist_id, (response) => {
				return res.status(200).json(response)
			})
		});
	})
});
//handle delete song
exports.handleSongs = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			let uid = response.payload.decodedToken.uid;
			let access_token = req.headers.access_token;
			let {
				playlist_id,
				songs_ids
			} = req.body.payload;

			switch (req.method) {
				case "POST":
					SPOTIFY.add_songs_to_playlist(uid, access_token, playlist_id, songs_ids, (response) => {
						return res.status(200).json(response)
					})
					break;
				default:
					return res.status(404).json({
						msg: "Method not found"
					});
			}

		});

	})
});