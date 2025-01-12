import mongoose from 'mongoose';

const { Schema } = mongoose;

const scholarshipSchema = new Schema({
  name: { type: String, required: true },
  deadline: { type: Date, required: true }, // Changed from application_deadline to deadline
  type: { 
    type: String, 
    enum: ['athletic', 'merit', 'need-based', 'grant'], // Enum for scholarship types
    required: true 
  },
  level: { 
    type: String, 
    enum: ['basic education', 'college', 'masters', 'doctorate', 'vocational'], // Enum for education levels
    required: true 
  },
  eligibility: { type: [String], required: true }, // Array of eligibility criteria
  benefits: { type: [String], required: true }, // Description of benefits
  requirements: { type: [String], required: true }, // Array of application requirements
  source: { // Array of source objects to accommodate multiple sources
    link: { type: String, required: true }, // Source link
    site: { type: String, required: true } // Source site name
  },
  misc: [{ 
    type: { type: String, required: true }, // Type of miscellaneous data
    data: { type: String, required: true } // Corresponding data for the miscellaneous type
  }],
  deleted_at: { type: Date, default: null } // Soft delete field
});

const Scholarships = mongoose.model('Scholarships', scholarshipSchema);

export default Scholarships;
