import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Men','Women','Children'], required: true },
  occasion: { type: String },
  collectionType: { type: String },
  childCategory: { type: String },
  mainImage: { type: String, required: true },
  mainImage2: { type: String },
  otherImages: { type: [String], default: [] },
  price: { type: Number },
  discountedPrice: { type: Number },
  status: { type: String, enum: ['Available','Out of Stock','Available for Rent'], default: 'Available' },
  isFeatured: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
