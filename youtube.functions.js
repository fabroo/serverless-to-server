require("dotenv").config();
const cors = require('cors')({
	origin: true
});

// const youtube_redirect_uri = 'http://localhost:5001/moodsic-proyecto/us-central1/youtube-callback';
const youtube_redirect_uri = 'https://us-central1-moodsic-proyecto.cloudfunctions.net/youtube-callback';

const YoutubeManager = require("./utils/youtube");
const YOUTUBE = new YoutubeManager(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, youtube_redirect_uri, process.env.YOUTUBE_API_KEY);

const AUTH = require("./utils/auth");
const functions = require("firebase-functions");


exports.callback = functions.https.onRequest(async (req, res) => {
	cors(req, res, async () => {
		let {
			state,
			code
		} = req.query;

		AUTH.validate_token(state, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}
			let uid = response.payload.decodedToken.uid;

			await YOUTUBE.get_credentials(code, uid, (response_data) => {
				if(!response.state){
                    return res.status(200).sendFile('./assets/success.html', {root: __dirname })
                }
                else {
                    return res.status(200).sendFile('./assets/error.html', {root: __dirname })
                }
			})
		});

	})
})

exports.handlePlaylists = functions.https.onRequest(async (req, res) => {
	cors(req, res, async () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			let access_token = req.headers.access_token;
			let {
				payload,
			} = req.body;
			let {
				playlist_id,
				only_ids
			} = req.query;


			let uid = response.payload.decodedToken.uid;

			switch (req.method) {
				case "GET":
					let part = ["id", "snippet", "contentDetails"];

					CYCLIC.youtube_get_playlist_by_id(access_token, part, playlist_id, (response) => {
						return res.status(200).json(response)
					})
					break;

				case "POST":
					await YOUTUBE.create_playlist(access_token, uid, payload, (response) => {
						return res.status(200).json(response)
					})
					break;
				default:
					res.status(404).send("Method not found")
			}
		});
	})
})

exports.refreshToken = functions.https.onRequest(async (req, res) => {
	cors(req, res, async () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			var refresh_token = req.headers.refresh_token;

			await YOUTUBE.refresh_token(refresh_token, response.payload.decodedToken.uid, (response) => {
				return res.json(response)
			})
		});

	})
})

exports.handleSongs = functions.https.onRequest(async (req, res) => {
	cors(req, res, async () => {
		let token = req.headers.authorization_token;

		AUTH.validate_token(token, async (response) => {
			if (!response.payload.authenticated) {
				return res.status(401).json(response)
			}

			let uid = response.payload.decodedToken.uid;
			let access_token = req.headers.access_token;
			let {
				playlist_id,
				song_id
			} = req.body.payload;

			switch (req.method) {
				case "POST":
					await YOUTUBE.add_song_to_playlist(access_token, uid, playlist_id, song_id, (response) => {
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