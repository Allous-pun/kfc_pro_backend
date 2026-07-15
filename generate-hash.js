const bcrypt = require('bcryptjs');

const password = 'admin2026';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log('Password:', password);
  console.log('Hash:', hash);
});suso