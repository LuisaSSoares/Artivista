const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKeyString = process.env.CRYPTO_SECRET || 'chave_super_secreta_32bytes!';
const key = crypto.createHash('sha256').update(secretKeyString).digest(); 

const iv = Buffer.alloc(16, 0); 

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };