import mongoose from 'mongoose';

const { Schema } = mongoose;

const scholarshipSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  deadline: { type: Schema.Types.Mixed, required: true },
  type: {
    type: String,
    enum: ['Athletic', 'Merit', 'Need-based', 'Grant'],
    required: true
  },
  level: {
    type: String,
    enum: ['Basic Education', 'College', 'Masters', 'Doctorate', 'Vocational'],
    required: true
  },
  eligibility: { type: [String] },
  benefits: { type: [String] },
  requirements: { type: [String] },
  source: {
    link: { type: String },
    site: { type: String }
  },
  misc: [{
    type: { type: String },
    data: { type: String }
  }],
  deleted_at: { type: Date, default: null }
});

const Scholarships = mongoose.model('Scholarships', scholarshipSchema);

export default Scholarships;
