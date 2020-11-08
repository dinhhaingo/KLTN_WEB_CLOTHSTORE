const jwt = require('jsonwebtoken');

let generateToken = async(user, secretSign, tokenLife) =>{
    return await new Promise(async(resolve, reject) => {
        const userData = {
            id: user.id,
            username: user.username,
            name: user.name,
        }

        await jwt.sign(
            {data: userData},
            secretSign,
            {
                algorithm: "HS256",
                expiresIn: tokenLife,
            },
            async(error, token) =>{
                if(error){
                    return reject(error);
                }
                resolve(token);
            });
    });
}

let verifyToken = async(token, secretKey) =>{
    return await new Promise (async(resolve, reject) => {
        await jwt.verify(token, secretKey, async(error, decoded) =>{
            if(error){
                return reject(error);
            }
            resolve(decoded);
        });
    });
}

module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken
};