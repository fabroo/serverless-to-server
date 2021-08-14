const admin = require("firebase-admin");

const validate_token = (token, cb) => {
    var response;
    if (token == null) {
        response = {
            state: true,
            payload: {
                authenticated: false
            },
            err: {
                msg: "Null Token"
            }
        }
        cb(response);
    } else {
        admin.auth().verifyIdToken(token)
            .then(function(decodedToken) {
                response = {
                    state: false,
                    payload: {
                        decodedToken: decodedToken,
                        authenticated: true
                    },
                    err: {}
                }
                cb(response);

            }).catch(function(error) {
                console.log("bb", error)
                response = {
                    state: true,
                    payload: {
                        authenticated: false
                    },
                    err: {
                        msg: error
                    }
                }
                cb(response);
            });
    }
}


module.exports = {
    validate_token
}