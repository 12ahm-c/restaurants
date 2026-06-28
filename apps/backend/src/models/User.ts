import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'server' | 'chef' | 'stock_manager';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  branchId?: mongoose.Types.ObjectId;
  language: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['owner', 'manager', 'cashier', 'server', 'chef', 'stock_manager'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    language: { type: String, default: 'fr', enum: ['fr', 'en', 'ar'] },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const retObj = ret as any;
    delete retObj.passwordHash;
    delete retObj.__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
