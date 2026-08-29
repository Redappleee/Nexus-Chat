import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICall extends Document {
  chat: Types.ObjectId;
  initiator: Types.ObjectId;
  participants: Types.ObjectId[];
  type: 'voice' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

const callSchema = new Schema<ICall>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    initiator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['voice', 'video'], required: true },
    status: { type: String, enum: ['ringing', 'active', 'ended', 'missed', 'rejected'], default: 'ringing' },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    duration: Number,
  },
  { timestamps: true }
);

export const Call = mongoose.model<ICall>('Call', callSchema);
