import mongoose from 'mongoose';

const { Schema } = mongoose;

const scholarshipSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  program_type: { type: String, required: true },
  scholarship_type: { type: String, required: true },
  eligibility_criteria: { type: [String], required: true },
  application_deadline: { type: Date, required: true },
  funding_amount: { type: Number, required: true },
  deleted_at: { type: Date, default: null }
});

const Scholarships = mongoose.model('Scholarships', scholarshipSchema);

export default Scholarships;
