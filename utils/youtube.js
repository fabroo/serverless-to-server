require("dotenv").config();
const axios = require('axios');

const UserManager = require('./user');
const COLLECTION = new UserManager();
/*
* [USEFUL LINKS] *
//let authLink = `https://accounts.google.com/o/oauth2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}`
//permissions: https://myaccount.google.com/u/0/permissions
//quota cost: https://developers.google.com/youtube/v3/determine_quota_cost
*/

class YoutubeManager {
	constructor(client_id, client_secret, redirect_uri, api_key) {
		this.youtube_client_id = client_id;
		this.redirect_uri = redirect_uri;
		this.youtube_client_secret = client_secret;
		this.youtube_api_key = api_key;
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
			let axiosResponse = await axios.post("https://accounts.google.com/o/oauth2/token", {
				code,
				client_id: this.youtube_client_id,
				client_secret: this.youtube_client_secret,
				redirect_uri: this.redirect_uri,
				grant_type: "authorization_code",
			})

			let {
				access_token,
				refresh_token
			} = axiosResponse.data;

			COLLECTION.actualizar_coleccion(uid, {
				youtube_access_token: access_token,
				youtube_refresh_token: refresh_token
			}, (response_data) => {
				return cb(this.build_response(response_data.payload, "inner"))
			})
		} catch (error) {
			//check axios or inner
			return cb(this.build_response(error, "inner"))
		}
	}

	create_playlist = async (access_token, uid, payload, cb) => {
		try {
			let axiosResponse = await axios.post(`https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&key=${this.youtube_api_key}`, {
				snippet: {
					title: payload.name,
					tags: [
						"Revibe"
					],
					description: payload.description
				},
			}, {
				headers: {
					"Authorization": `Bearer ${access_token}`,
					"Accept": "application/json",
					"Content-Type": "application/json"
				}
			})
			let playlist_resource = axiosResponse.data;
			COLLECTION.agregar_playlist_data("playlist", uid, {
				id: playlist_resource.id,
				name: payload.name
			}, "youtube", (response_data) => {
				return cb(this.build_response(response_data, "inner"))
			})
		} catch (error) {
			//check axios or inner
			return cb(this.build_response(error, "axios"))
		}
	}

	refresh_token = async (refresh_token, uid, cb) => {
		try {
			let axiosResponse = await axios.post("https://accounts.google.com/o/oauth2/token", {
				refresh_token,
				client_id: this.youtube_client_id,
				client_secret: this.youtube_client_secret,
				grant_type: "refresh_token",
			})

			let access_token = axiosResponse.data.access_token;
			COLLECTION.actualizar_coleccion(uid, {
				youtube_access_token: access_token
			}, (response_data) => {
				return cb(this.build_response(response_data, "inner"))
			})
		} catch (error) {
			//check axios or inner
			return cb(this.build_response(error, "axios"))
		}
	}

	add_song_to_playlist = async (access_token, uid, playlist_id, song_id, cb) => {
		try {
			await axios.post(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&key=${this.youtube_api_key}`, {
				snippet: {
					playlistId: playlist_id,
					resourceId: {
						kind: "youtube#video",
						videoId: song_id
					}
				}
			}, {
				headers: {
					"Authorization": `Bearer ${access_token}`,
					"Accept": "application/json",
					"Content-Type": "application/json"
				}

			})
			COLLECTION.agregar_playlist_data("song", uid, {
				access_token,
				playlist_id,
				songs: song_id
			}, "youtube", (response_data) => {
				return cb(this.build_response(response_data, "inner"));
			})
		} catch (error) {
			return cb(this.build_response(error, "axios"));

		}

	}
}

module.exports = YoutubeManager