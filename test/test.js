// require("dotenv").config({ path: __dirname + '../../.env' });
// const axios = require('axios')
// const querystring = require('querystring');


// let refresh_token = "AQA2XuFK6fgvUbtWOMi9CbJ-PTYVedhzr5LQp5cyaKWTTX1LEY7VBAqsYPAyH5QPvQn7Z63yJpA7Z9X4BOUBc0v7fAYc4M57C8aPmFM3-i3c8ccFBdv30K0xs_DYMUVo5Bs"

// axios.post(`https://accounts.spotify.com/api/token`,
//     querystring.stringify({
//         refresh_token: refresh_token,
//         grant_type: 'refresh_token'
//     }), {
//     headers: {
//         'Authorization': `Basic  ${Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')}`,
//         "Content-Type": "application/x-www-form-urlencoded"
//     }
// })
//     .then((res) => {
//         console.log(res.status)
//         console.log(res.data)
//     })
//     .catch((err) => {
//         console.log(err)
//     })
const axios = require('axios');
const fs = require('fs');


let access_token = "BQBKSrsg2IpyLy-hdPTyicjZYbwr2iMEomG00GS8FlocUfWYlJoarWox2oLcRPqeOnCW60DxK2imGyl0k0HAf5V9yCD5yz0EuGhChsjVHl-XAkQ7UXhbRFhXrNCTdxaQcCfzmnRau2tjfHj0cXBa47QPSpO-KI0ZS05V0rXnFKLS7zF2xcraLim1zDvYTZiPKgL-HfMkPsnxyQ"
let playlist_id = "2vFZTF2stzddZl8ZzAGzqL"
let offset = 0;

get_playlists = async (access_token, playlist_id) => {
  try {
    let axiosResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items(track(name, artists(name)))&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
    })
    return axiosResponse.data.items
  } catch (error) {
    console.log(error)
  }
}

let items = [];

const main = async () =>{
  for(let i = 0; i < 8; i++){
    items.push((await get_playlists(access_token, playlist_id, offset)).map(track => track.track.name+"$$$"+track.track.artists[0].name))
    offset += 100
  }
  
  fs.writeFile("tracks.txt", items.flat().join("+++"), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
  });
}

main();
