import mongoose from 'mongoose';

const CelebrityVideoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.CelebrityVideo || mongoose.model('CelebrityVideo', CelebrityVideoSchema);
