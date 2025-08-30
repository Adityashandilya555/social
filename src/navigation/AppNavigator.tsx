import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {HomeScreen} from '../screens/HomeScreen';
import {EventDetailScreen} from '../screens/EventDetailScreen';
import {MarketplaceScreen} from '../screens/MarketplaceScreen';
import {CreateListingScreen} from '../screens/CreateListingScreen';
import {IEvent} from '../models/Event';

export type RootStackParamList = {
  Home: undefined;
  EventDetail: {event: IEvent};
  Marketplace: undefined;
  CreateListing: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Marketplace"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1a1a1a',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Campus Events',
          }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            title: 'Event Details',
          }}
        />
        <Stack.Screen
          name="Marketplace"
          component={MarketplaceScreen}
          options={{
            title: 'Marketplace',
          }}
        />
        <Stack.Screen
          name="CreateListing"
          component={CreateListingScreen}
          options={{
            title: 'Create Listing',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};