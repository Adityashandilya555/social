import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
}

interface ImagePickerProps {
  onImageSelected: (imageUrl: string) => void;
  placeholder?: string;
  selectedImageUrl?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  placeholder = 'Select Image',
  selectedImageUrl,
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(selectedImageUrl);

  const selectImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        uploadToCloudinary(response.assets[0]);
      }
    });
  };

  const getUploadSignature = async (): Promise<CloudinarySignature> => {
    const response = await fetch('/api/media/sign-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload signature: ${response.status}`);
    }

    return response.json();
  };

  const uploadToCloudinary = async (asset: any) => {
    if (!asset.uri) return;

    setUploading(true);

    try {
      // Get signed upload parameters
      const signature = await getUploadSignature();

      // Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'image.jpg',
      } as any);
      
      formData.append('signature', signature.signature);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('api_key', signature.api_key);
      formData.append('transformation', 'w_800,q_auto,f_auto');
      formData.append('folder', 'campus_connect');

      // Upload to Cloudinary
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      
      if (result.secure_url) {
        setImageUrl(result.secure_url);
        onImageSelected(result.secure_url);
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }

    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload image. Please try again.',
        [{text: 'OK'}]
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.imageContainer, imageUrl && styles.imageSelected]}
        onPress={selectImage}
        disabled={uploading}>
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#333333" />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        ) : imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
      </TouchableOpacity>
      {imageUrl && (
        <TouchableOpacity
          style={styles.changeButton}
          onPress={selectImage}
          disabled={uploading}>
          <Text style={styles.changeButtonText}>Change Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageSelected: {
    borderStyle: 'solid',
    borderColor: '#333333',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  changeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
});