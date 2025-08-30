import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IComment {
  author: IUser['_id'];
  content: string;
  createdAt: Date;
  _id: mongoose.Types.ObjectId;
}

export interface IPost extends Document {
  content: string;
  author: IUser['_id'];
  imageUrl?: string;
  likes: IUser['_id'][];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required'],
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PostSchema: Schema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
    },
    imageUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: 'Invalid image URL format',
      },
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [CommentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PostSchema.index({ author: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ content: 'text' });
PostSchema.index({ likes: 1 });

PostSchema.virtual('likeCount').get(function(this: IPost) {
  return this.likes.length;
});

PostSchema.virtual('commentCount').get(function(this: IPost) {
  return this.comments.length;
});

PostSchema.virtual('hasImage').get(function(this: IPost) {
  return !!this.imageUrl;
});

PostSchema.methods.addLike = function(userId: mongoose.Types.ObjectId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return this;
};

PostSchema.methods.removeLike = function(userId: mongoose.Types.ObjectId) {
  this.likes = this.likes.filter(likeId => !likeId.equals(userId));
  return this.save();
};

PostSchema.methods.toggleLike = function(userId: mongoose.Types.ObjectId) {
  const hasLiked = this.likes.some(likeId => likeId.equals(userId));
  if (hasLiked) {
    return this.removeLike(userId);
  } else {
    return this.addLike(userId);
  }
};

PostSchema.methods.addComment = function(userId: mongoose.Types.ObjectId, content: string) {
  this.comments.push({
    author: userId,
    content: content.trim(),
    createdAt: new Date(),
  });
  return this.save();
};

PostSchema.methods.removeComment = function(commentId: mongoose.Types.ObjectId) {
  this.comments = this.comments.filter(comment => !comment._id.equals(commentId));
  return this.save();
};

PostSchema.methods.isLikedBy = function(userId: mongoose.Types.ObjectId) {
  return this.likes.some(likeId => likeId.equals(userId));
};

export default mongoose.model<IPost>('Post', PostSchema);