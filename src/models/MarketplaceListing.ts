import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export enum ListingCategory {
  BOOKS = 'books',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  OTHER = 'other',
}

export interface IMarketplaceListing extends Document {
  title: string;
  description?: string;
  price: number;
  seller: IUser['_id'];
  imageUrls: string[];
  category: ListingCategory;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
      validate: {
        validator: function(price: number) {
          return Number.isFinite(price) && price >= 0;
        },
        message: 'Price must be a valid positive number',
      },
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    imageUrls: [{
      type: String,
      validate: {
        validator: function(url: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url);
        },
        message: 'Invalid image URL format',
      },
    }],
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: Object.values(ListingCategory),
        message: 'Category must be one of: books, electronics, furniture, other',
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MarketplaceListingSchema.index({ seller: 1 });
MarketplaceListingSchema.index({ category: 1 });
MarketplaceListingSchema.index({ price: 1 });
MarketplaceListingSchema.index({ isAvailable: 1 });
MarketplaceListingSchema.index({ createdAt: -1 });
MarketplaceListingSchema.index({ title: 'text', description: 'text' });

MarketplaceListingSchema.virtual('formattedPrice').get(function(this: IMarketplaceListing) {
  return `$${this.price.toFixed(2)}`;
});

MarketplaceListingSchema.virtual('hasImages').get(function(this: IMarketplaceListing) {
  return this.imageUrls && this.imageUrls.length > 0;
});

MarketplaceListingSchema.methods.markAsSold = function() {
  this.isAvailable = false;
  return this.save();
};

MarketplaceListingSchema.methods.markAsAvailable = function() {
  this.isAvailable = true;
  return this.save();
};

MarketplaceListingSchema.methods.addImage = function(imageUrl: string) {
  if (this.imageUrls.length < 10) { // Limit to 10 images
    this.imageUrls.push(imageUrl);
    return this.save();
  }
  throw new Error('Maximum of 10 images allowed per listing');
};

export default mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema);