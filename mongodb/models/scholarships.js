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

// Create indexes for optimal query performance
scholarshipSchema.index({ deleted_at: 1 }); // Primary filter index
scholarshipSchema.index({ deadline: 1, deleted_at: 1 }); // For deadline sorting
scholarshipSchema.index({ name: 1, deleted_at: 1 }); // For name sorting
scholarshipSchema.index({ type: 1, deleted_at: 1 }); // For type filtering
scholarshipSchema.index({ level: 1, deleted_at: 1 }); // For level filtering
scholarshipSchema.index({ deadline: 1, name: 1, deleted_at: 1 }); // Compound index for deadline + name sorting

// Text index for search functionality
scholarshipSchema.index({
  name: 'text',
  description: 'text',
  type: 'text',
  level: 'text',
  'source.site': 'text'
}, {
  weights: {
    name: 10,
    description: 5,
    type: 3,
    level: 3,
    'source.site': 1
  }
});

const Scholarships = mongoose.model('Scholarships', scholarshipSchema);

export default Scholarships;
