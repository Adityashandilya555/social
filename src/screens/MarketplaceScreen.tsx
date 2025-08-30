import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {IMarketplaceListing} from '../models/MarketplaceListing';
import {Card} from '../components/Card';
import {RootStackParamList} from '../navigation/AppNavigator';

type MarketplaceScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Marketplace'
>;

interface Props {
  navigation: MarketplaceScreenNavigationProp;
}

interface ListingItemProps {
  listing: IMarketplaceListing;
  onPress: () => void;
}

const ListingItem: React.FC<ListingItemProps> = ({listing, onPress}) => {
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <TouchableOpacity style={styles.listingContainer} onPress={onPress}>
      <Card style={styles.listingCard}>
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <Image
            source={{uri: listing.imageUrls[0]}}
            style={styles.listingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderIcon}>📦</Text>
          </View>
        )}
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.listingPrice}>{formatPrice(listing.price)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export const MarketplaceScreen: React.FC<Props> = ({navigation}) => {
  const [listings, setListings] = useState<IMarketplaceListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert(
        'Error',
        'Failed to load marketplace listings. Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleListingPress = (listing: IMarketplaceListing) => {
    // TODO: Navigate to listing detail screen when created
    console.log('Pressed listing:', listing.title);
  };

  const handleCreateListing = () => {
    navigation.navigate('CreateListing');
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const renderListingItem = ({item}: {item: IMarketplaceListing}) => (
    <ListingItem listing={item} onPress={() => handleListingPress(item)} />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333333" />
        <Text style={styles.loadingText}>Loading marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Marketplace</Text>
      <FlatList
        data={listings}
        keyExtractor={item => (item._id as string).toString()}
        renderItem={renderListingItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#333333']}
            tintColor="#333333"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>No items available</Text>
            <Text style={styles.emptySubtext}>
              Be the first to list something for sale!
            </Text>
          </View>
        }
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateListing}
        activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  listContainer: {
    padding: 8,
    paddingBottom: 100, // Space for FAB
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  listingContainer: {
    flex: 0.48, // Slightly less than half to allow for spacing
    marginBottom: 16,
  },
  listingCard: {
    padding: 0,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 120,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});