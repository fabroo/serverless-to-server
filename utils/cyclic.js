const request = require('request');
const axios = require('axios');

//CHANGE TO AXIOS

class Cyclic{
   
    spotify_get_playlist_by_id = (access_token, playlist_id, only_ids, cb) => {
        var response;
    
        const request_payload = {
            url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks${only_ids ? '?fields=items(track(id))' : ''}`,
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            json: true
        };
    
        request.get(request_payload, (error, httpResponse, response_data) => {
            console.log(httpResponse.statusCode)
            if (!error && httpResponse.statusCode < 400) {
                response = {
                    state: false,
                    payload: {
                        fetched: true,
                        data: response_data
                    },
                    err: {}
                }
                return cb(response)
            } else {
                response = {
                    state: true,
                    payload: {
                        fetched: false
                    },
                    err: {
                        msg: response_data.error.message,
                        status: response_data.error.status
                    }
                }
                return cb(response)
            }
        });
    
    }
    
    youtube_get_playlist_by_id = (access_token, part, playlist_id, cb) => {
        var response;
        axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=${encodeURIComponent(part)}&playlistId=${playlist_id}&key=${process.env.YOUTUBE_API_KEY}`, {
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Accept": "application/json"
            }
        }).then(res => {
            let { items } = res.data;
            response = {
                state: false,
                payload: {
                    fetched: true,
                    items: items
                },
                err: {}
            }
            return cb(response);
        }).catch(error => {
            response = {
                state: true,
                payload: {
                    fetched: false
                },
                err: {
                    msg: error
                }
            }
            return cb(response);
        })
    }
}

module.exports = Cyclic;