import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {IEvent} from '../models/Event';
import {IUser} from '../models/User';
import {Card} from '../components/Card';

type EventDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EventDetail'
>;
type EventDetailScreenRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;

interface Props {
  navigation: EventDetailScreenNavigationProp;
  route: EventDetailScreenRouteProp;
}

interface EventWithHost extends IEvent {
  host: IUser;
  attendees: IUser[];
}

export const EventDetailScreen: React.FC<Props> = ({route}) => {
  const {event: initialEvent} = route.params;
  const [event, setEvent] = useState<EventWithHost | null>(null);
  const [isAttending, setIsAttending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [attendButtonLoading, setAttendButtonLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${initialEvent._id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const eventData: EventWithHost = await response.json();
      setEvent(eventData);
      
      // TODO: Check if current user is attending (would need user context)
      // For now, we'll assume user is not attending initially
      setIsAttending(false);
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert(
        'Error',
        'Failed to load event details. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAttendEvent = async () => {
    if (!event) return;

    setAttendButtonLoading(true);
    try {
      const response = await fetch(`/api/events/${event._id}/attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsAttending(!isAttending);
      
      // Refresh event details to get updated attendees list
      await fetchEventDetails();
      
      Alert.alert(
        'Success',
        isAttending ? 'You are no longer attending this event.' : "Great! You're now attending this event.",
      );
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert(
        'Error',
        'Failed to update attendance. Please try again.',
      );
    } finally {
      setAttendButtonLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEventDetails();
  };

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333333" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#333333']}
          tintColor="#333333"
        />
      }>
      <Card style={styles.eventCard}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionLabel}>Host</Text>
          <Text style={styles.hostName}>{event.host.name}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionLabel}>Date & Time</Text>
          <Text style={styles.dateTime}>
            {formatDate(event.startTime)}
          </Text>
          <Text style={styles.timeRange}>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </Text>
        </View>

        {event.locationName && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Location</Text>
            <Text style={styles.location}>{event.locationName}</Text>
          </View>
        )}
      </Card>

      <TouchableOpacity
        style={[styles.attendButton, isAttending && styles.attendingButton]}
        onPress={handleAttendEvent}
        disabled={attendButtonLoading}>
        {attendButtonLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.attendButtonText}>
            {isAttending ? "I'm Not Going" : "I'm Going"}
          </Text>
        )}
      </TouchableOpacity>

      <Card style={styles.attendeesCard}>
        <Text style={styles.sectionLabel}>
          Attendees ({event.attendees.length})
        </Text>
        {event.attendees.length > 0 ? (
          <View style={styles.attendeesList}>
            {event.attendees.map((attendee, index) => (
              <View key={attendee._id} style={styles.attendeeItem}>
                <Text style={styles.attendeeName}>{attendee.name}</Text>
                {attendee.major && (
                  <Text style={styles.attendeeMajor}>{attendee.major}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyAttendeesText}>
            No one is attending yet. Be the first!
          </Text>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  eventCard: {
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    lineHeight: 34,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 24,
  },
  hostName: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  dateTime: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 4,
  },
  timeRange: {
    fontSize: 16,
    color: '#666666',
  },
  location: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  attendButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  attendingButton: {
    backgroundColor: '#666666',
  },
  attendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  attendeesCard: {
    marginBottom: 20,
  },
  attendeesList: {
    marginTop: 8,
  },
  attendeeItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  attendeeMajor: {
    fontSize: 14,
    color: '#666666',
  },
  emptyAttendeesText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
});