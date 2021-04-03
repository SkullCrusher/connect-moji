
module.exports.encryptMessage = function encryptMessage(data, encryptionKey){
  // get password's md5 hash
  let password_hash = crypto.createHash('md5').update(encryptionKey, 'utf-8').digest('hex').toUpperCase();
  let iv            = new Buffer.alloc(16);

  // encrypt data
  let cipher = crypto.createCipheriv('aes-256-cbc', password_hash, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
      
  return encryptedData.toUpperCase();
}

module.exports.decryptMessage = function decryptMessage(data, encryptionKey){

}


module.exports.makeid = function (length){
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    return result;
}
  