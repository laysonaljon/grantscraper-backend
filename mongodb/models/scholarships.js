import mongoose from 'mongoose';

const { Schema } = mongoose;

const nested = new Schema({
  title: { type: String },
  items: { type: [String] }
});

const scholarshipSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  deadline: { type: Schema.Types.Mixed, required: true },
  type: {
    type: String,
    enum: ['Athletic', 'Art', 'Merit', 'Need-based', 'Grant'],
    required: true
  },
  level: {
    type: String,
    enum: ['Basic Education', 'College', 'Graduate', 'Vocational'],
    required: true
  },
  eligibility: { type: Schema.Types.Mixed },
  benefits: { type: Schema.Types.Mixed },
  requirements: { type: Schema.Types.Mixed },
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
