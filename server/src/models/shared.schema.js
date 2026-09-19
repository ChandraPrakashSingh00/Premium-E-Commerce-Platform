import mongoose from 'mongoose';

export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 1000 },
    publicId: { type: String, trim: true, maxlength: 300 },
    alt: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { _id: false },
);

export const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 170 },
    keywords: [{ type: String, trim: true, maxlength: 50 }],
    canonicalUrl: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

export const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { _id: false },
);

/** Removes internal fields from JSON output. */
export const baseToJSON = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret.id;
    return ret;
  },
};
