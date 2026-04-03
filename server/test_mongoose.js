const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = new Schema({
    email: { type: String, lowercase: true }
});
const User = mongoose.model('TestUser', userSchema);
const q = User.findOne({ email: 'Test@EXAMPLE.com' });
console.log(q.getQuery());
