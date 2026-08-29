import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStory extends Document {
  user: Types.ObjectId;
  media: { url: string; type: 'image' | 'video' };
  caption?: string;
  views: Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    media: { url: { type: String, required: true }, type: { type: String, enum: ['image', 'video'], required: true } },
    caption: String,
    views: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const Story = mongoose.model<IStory>('Story', storySchema);
