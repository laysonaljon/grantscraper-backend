import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true },
  scholarship_id: { type: String, required: true },
  level: { type: String, required: true },
  type: { type: String, required: true },
});

const Users = mongoose.model('Users', userSchema);

export default Users;
