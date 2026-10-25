const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function makeAdmin() {
  const email = (process.argv[2] || '').trim();
  if (!email) {
    console.log('Usage: node makeAdmin.js your@email.com');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    console.log(user ? `${user.email} is now admin` : 'No user found with this email');
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();