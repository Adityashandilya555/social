import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {Card} from '../components/Card';
import {ImagePicker} from '../components/ImagePicker';
import {ListingCategory} from '../models/MarketplaceListing';

type CreateListingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateListing'
>;
type CreateListingScreenRouteProp = RouteProp<
  RootStackParamList,
  'CreateListing'
>;

interface Props {
  navigation: CreateListingScreenNavigationProp;
  route: CreateListingScreenRouteProp;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category: ListingCategory;
  imageUrl: string;
}

export const CreateListingScreen: React.FC<Props> = ({navigation}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: ListingCategory.OTHER,
    imageUrl: '',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelected = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your listing.');
      return false;
    }
    if (!formData.price.trim()) {
      Alert.alert('Validation Error', 'Please enter a price.');
      return false;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrls: formData.imageUrl ? [formData.imageUrl] : [],
        // TODO: Add actual user ID when authentication is implemented
        seller: '64a7b9c1d2e3f4a5b6c7d8e9', // Placeholder seller ID
      };

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      Alert.alert(
        'Success',
        'Your listing has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(
        'Error',
        'Failed to create listing. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    {label: 'Books', value: ListingCategory.BOOKS},
    {label: 'Electronics', value: ListingCategory.ELECTRONICS},
    {label: 'Furniture', value: ListingCategory.FURNITURE},
    {label: 'Other', value: ListingCategory.OTHER},
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add Photos</Text>
          <ImagePicker
            onImageSelected={handleImageSelected}
            placeholder="Add a photo of your item"
            selectedImageUrl={formData.imageUrl}
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="Enter item title"
              maxLength={200}
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Describe your item (optional)"
              maxLength={1000}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Price *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.price}
              onChangeText={(text) => handleInputChange('price', text)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryButton,
                    formData.category === option.value && styles.categoryButtonSelected,
                  ]}
                  onPress={() => handleInputChange('category', option.value)}>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === option.value && styles.categoryButtonTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Card>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 100,
  },
  categoryContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 12,
  },
  categoryButtonSelected: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  submitButtonDisabled: {
    backgroundColor: '#666666',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});