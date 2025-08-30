import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IEvent extends Document {
  title: string;
  description: string;
  locationName?: string;
  locationCoords?: {
    type: 'Point';
    coordinates: [number, number];
  };
  startTime: Date;
  endTime: Date;
  host: IUser['_id'];
  attendees: IUser['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    locationName: {
      type: String,
      trim: true,
      maxlength: [200, 'Location name cannot exceed 200 characters'],
    },
    locationCoords: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(coords: number[]) {
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates format [longitude, latitude]',
        },
      },
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      validate: {
        validator: function(startTime: Date) {
          return startTime > new Date();
        },
        message: 'Start time must be in the future',
      },
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function(this: IEvent, endTime: Date) {
          return endTime > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event host is required'],
    },
    attendees: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

EventSchema.index({ startTime: 1 });
EventSchema.index({ host: 1 });
EventSchema.index({ locationCoords: '2dsphere' });
EventSchema.index({ title: 'text', description: 'text' });

EventSchema.virtual('attendeeCount').get(function(this: IEvent) {
  return this.attendees.length;
});

EventSchema.virtual('isUpcoming').get(function(this: IEvent) {
  return this.startTime > new Date();
});

export default mongoose.model<IEvent>('Event', EventSchema);