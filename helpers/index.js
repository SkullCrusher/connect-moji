
// https://docs.expo.io/versions/latest/sdk/crypto/
// const crypto = require('expo-crypto');
const CryptoJS = require("crypto-js");

/**
 * encryptMessage
 * Encrypt a message using the provided key.
 * 
 * @param {string} data
 * @param {string} encryptionKey
 * 
 * @returns string
 */
module.exports.encryptMessage = function encryptMessage(data, encryptionKey){

    // If we don't have an encryption key, just return the value.
    if(encryptionKey === ""){
        return data;
    }
    /*

    // get password's md5 hash
    let password_hash = crypto.createHash('md5').update(encryptionKey, 'utf-8').digest('hex').toUpperCase();
    let iv            = new Buffer.alloc(16);

    // encrypt data
    let cipher = crypto.createCipheriv('aes-256-cbc', password_hash, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
      
    return encryptedData.toUpperCase();
    */

    return CryptoJS.AES.encrypt(data, encryptionKey).toString();
};

/**
 * decryptMessage
 * Decrypt a message using the provided key.
 * 
 * @param {string} data
 * @param {string} encryptionKey
 * 
 * @returns string
 */
module.exports.decryptMessage = function decryptMessage(data, encryptionKey){
    
    // If we don't have an encryption key, just return the value.
    if(encryptionKey === ""){
        return data;
    }

    /*
    // get password's md5 hash
    
    let password_hash = crypto.createHash('md5').update(encryptionKey, 'utf-8').digest('hex').toUpperCase();
    let iv            = new Buffer.alloc(16);
    let decipher      = crypto.createDecipheriv('aes-256-cbc', password_hash, iv);

    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    */

    var bytes  = CryptoJS.AES.decrypt(data, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * makeid
 * Make a random string guid.
 * 
 * @param {int} length 
 * 
 * @returns string
 */
module.exports.makeid = function (length){
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    return result;
};
  