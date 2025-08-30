import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IClub extends Document {
  name: string;
  description?: string;
  members: IUser['_id'][];
  officers: IUser['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Club name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    officers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function(this: IClub, officerId: mongoose.Types.ObjectId) {
          return this.members.includes(officerId);
        },
        message: 'Officers must be members of the club',
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ClubSchema.index({ name: 1 });
ClubSchema.index({ name: 'text', description: 'text' });
ClubSchema.index({ members: 1 });
ClubSchema.index({ officers: 1 });

ClubSchema.virtual('memberCount').get(function(this: IClub) {
  return this.members.length;
});

ClubSchema.virtual('officerCount').get(function(this: IClub) {
  return this.officers.length;
});

ClubSchema.methods.addMember = function(userId: mongoose.Types.ObjectId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

ClubSchema.methods.removeMember = function(userId: mongoose.Types.ObjectId) {
  this.members = this.members.filter(memberId => !memberId.equals(userId));
  this.officers = this.officers.filter(officerId => !officerId.equals(userId));
  return this.save();
};

ClubSchema.methods.addOfficer = function(userId: mongoose.Types.ObjectId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  if (!this.officers.includes(userId)) {
    this.officers.push(userId);
  }
  return this.save();
};

ClubSchema.methods.removeOfficer = function(userId: mongoose.Types.ObjectId) {
  this.officers = this.officers.filter(officerId => !officerId.equals(userId));
  return this.save();
};

export default mongoose.model<IClub>('Club', ClubSchema);