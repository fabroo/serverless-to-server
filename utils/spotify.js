require("dotenv").config();

const UserManager = require('./user');
const COLLECTION = new UserManager();

const CyclicManager = require("./cyclic");
const CYCLIC_FUNCTIONS = new CyclicManager();

const axios = require('axios')
const querystring = require('querystring');


class SpotifyManager {

	constructor(client_id, client_secret, redirect_uri) {
		this.spotify_client_id = client_id;
		this.spotify_client_secret = client_secret;
		this.redirect_uri = redirect_uri;
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

	get_credentials = async (code, uid, cb) => {
		try {
			let axiosResponse = await axios.post("https://accounts.spotify.com/api/token", querystring.stringify({
				code: code,
				redirect_uri: this.redirect_uri,
				grant_type: 'authorization_code'
			}), {
				headers: {
					'Authorization': `Basic ${Buffer.from(this.spotify_client_id + ':' + this.spotify_client_secret).toString('base64')}`,
					"Content-Type": "application/x-www-form-urlencoded"
				}
			})

			const {
				access_token,
				refresh_token
			} = axiosResponse.data;

			await this.get_data(access_token, (response_data) => {
				if (response_data.state) {
					return cb(this.build_response(response_data.payload, "inner"))
				}
				COLLECTION.actualizar_coleccion(uid, {
					spotify_access_token: access_token,
					spotify_refresh_token: refresh_token,
					spotify_user_info: response_data.payload
				}, (response_data) => {
					return cb(this.build_response(response_data.payload, "inner"))
				})
			})
		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}

	get_data = async (access_token, cb) => {
		try {
			let axiosResponse = await axios.get(`https://api.spotify.com/v1/me`, {
				headers: {
					'Authorization': `Bearer ${access_token}`
				}
			})
			return cb(this.build_response(axiosResponse, "axios"))
		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}

	refresh_token = async (refresh_token, uid, cb) => {
		try {

			let axiosResponse = await axios.post(`https://accounts.spotify.com/api/token`,
				querystring.stringify({
					refresh_token: refresh_token,
					grant_type: 'refresh_token'
				}), {
					headers: {
						'Authorization': `Basic  ${Buffer.from(this.spotify_client_id + ':' + this.spotify_client_secret).toString('base64')}`,
						"Content-Type": "application/x-www-form-urlencoded"
					}
				})

			var access_token = axiosResponse.data.access_token;

			COLLECTION.actualizar_coleccion(uid, {
				spotify_access_token: access_token
			}, (response_data) => {
				console.log(response_data)
				return cb(this.build_response(response_data.payload, "inner"))
			})
		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}

	create_playlist = async (uid, body, access_token, spotify_id, cb) => {
		try {

			let axiosResponse = await axios.post(`https://api.spotify.com/v1/users/${spotify_id}/playlists`,
				body, {
					headers: {
						'Authorization': `Bearer ${access_token}`,
						"Content-Type": "application/json"
					}
				})
			COLLECTION.agregar_playlist_data("playlist", uid, {
				id: axiosResponse.data.id,
				name: body.name
			}, "spotify", (response_data) => {
				return cb(response_data)
			})
		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}

	get_playlists = async (access_token, cb) => {
		try {
			let axiosResponse = await axios.get(`https://api.spotify.com/v1/me/playlists`, {
				headers: {
					'Authorization': `Bearer ${access_token}`,
					"Content-Type": "application/json"
				}
			})
			return cb(this.build_response(axiosResponse, "axios"))
		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}

	top_genres = (top_tracks) => {
		var genres = {}
		for (var artist of top_tracks["items"]) {
			for (var genre of artist.genres) {
				if (genres[genre]) {
					genres[genre] += 1
				} else {
					genres[genre] = 1
				}
			}
		}
		return genres;
	}

	get_tops_by_type = async (access_token, type, cb) => {
		try {
			let axiosResponse = await axios.get(`https://api.spotify.com/v1/me/top/${type}?time_range=short_term`, {
				headers: {
					'Authorization': `Bearer ${access_token}`,
					"Content-Type": "application/json"
				}
			})

			let genres = this.top_genres(axiosResponse.data);

			axiosResponse.data.genres = genres;
			axiosResponse.data.items = {};

			return cb(this.build_response(axiosResponse, "axios"))

		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}

	get_playlist_tracks_features = async (access_token, playlist_id, cb) => {
		await CYCLIC_FUNCTIONS.spotify_get_playlist_by_id(access_token, playlist_id, true, async (response_data) => {
			if (response_data.state) {
				return cb(this.build_response(response_data.payload, "inner"))
			}

			let ids = response_data.payload.data.items.map(track => track.track.id)

			try {
				let axiosResponse = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${encodeURI(ids)}`, {
					headers: {
						'Authorization': `Bearer ${access_token}`,
						"Content-Type": "application/json"
					}
				})

				return cb(this.build_response(axiosResponse, "axios"))
			} catch (error) {
				error.status = 400
				return cb(this.build_response(error, "inner"))
			}
		})
	}

	//check
	add_songs_to_playlist = async (uid, access_token, playlist_id, song_id, cb) => {
		try {
			await axios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?uris=${encodeURI(song_id)}`, {}, {
				headers: {
					'Authorization': `Bearer ${access_token}`
				}
			})
			COLLECTION.agregar_playlist_data("song", uid, {
				access_token,
				playlist_id,
				songs: song_id
			}, "spotify", (response_data) => {
				return cb(response_data)
			})

		} catch (error) {
			error.status = 400
			return cb(this.build_response(error, "inner"))
		}
	}
}




module.exports = SpotifyManager;