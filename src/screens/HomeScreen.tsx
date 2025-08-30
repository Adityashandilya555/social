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
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {Card} from '../components/Card';
import {IEvent} from '../models/Event';
import {RootStackParamList} from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface EventItemProps {
  event: IEvent;
  onPress: () => void;
}

const EventItem: React.FC<EventItemProps> = ({event, onPress}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventTime}>{formatDate(event.startTime)}</Text>
        {event.locationName && (
          <Text style={styles.eventLocation}>{event.locationName}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
};

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert(
        'Error',
        'Failed to load events. Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventPress = (event: IEvent) => {
    navigation.navigate('EventDetail', {event});
  };

  const renderEventItem = ({item}: {item: IEvent}) => (
    <EventItem event={item} onPress={() => handleEventPress(item)} />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333333" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Campus Events</Text>
      <FlatList
        data={events}
        keyExtractor={item => (item._id as string).toString()}
        renderItem={renderEventItem}
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
            <Text style={styles.emptyText}>No events available</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh or check back later
            </Text>
          </View>
        }
      />
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
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});