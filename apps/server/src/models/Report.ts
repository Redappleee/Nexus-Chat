import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport extends Document {
  reporter: Types.ObjectId;
  reportedUser?: Types.ObjectId;
  reportedMessage?: Types.ObjectId;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    reportedMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>('Report', reportSchema);
