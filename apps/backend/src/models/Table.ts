import mongoose, { Document, Schema } from 'mongoose';

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'in-service';

export interface ITable extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  branchId?: mongoose.Types.ObjectId;
  capacity: number;
  status: TableStatus;
  zone: string;
  position: { x: number; y: number };
  currentOrderId?: mongoose.Types.ObjectId;
  serverId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['free', 'occupied', 'reserved', 'in-service'],
      default: 'free',
    },
    zone: { type: String, required: true, trim: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    serverId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

tableSchema.index({ status: 1 });
tableSchema.index({ zone: 1 });
tableSchema.index({ branchId: 1 });

export const Table = mongoose.model<ITable>('Table', tableSchema);
