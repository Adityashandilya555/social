import express from 'express';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
}

/**
 * POST /api/media/sign-upload
 * Generate a signed upload preset for Cloudinary with image optimization
 */
router.post('/sign-upload', async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const params = {
      timestamp: timestamp,
      transformation: 'w_800,q_auto,f_auto',
      folder: 'campus_connect',
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

    const response: CloudinarySignatureResponse = {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({
      message: 'Failed to generate upload signature',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;