# Google Maps Integration Setup

This document explains how to set up Google Maps for the Women Bus Safety Tracking System.

## 🗺️ Features Implemented

- **Real-time Bus Tracking**: Live bus location on map
- **User Location**: Current user position with blue marker
- **Route Visualization**: Line connecting user to bus
- **Interactive Map**: Zoom, pan, and location controls
- **Permission Handling**: Location permission requests

## 📋 Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (optional for future features)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure API Key

Edit `google-maps-config.js`:

```javascript
export const GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

### 3. Platform-Specific Setup

#### Android Setup
1. Open `android/app/src/main/AndroidManifest.xml`
2. Add inside `<application>` tag:

```xml
<meta-data android:name="com.google.android.geo.API_KEY"
           android:value="YOUR_ACTUAL_API_KEY_HERE"/>
```

#### iOS Setup
1. Open `ios/YourAppName/AppDelegate.mm`
2. Add after `#import "AppDelegate.h"`:

```objectivec
#import <GoogleMaps/GoogleMaps.h>
```

3. Add in `didFinishLaunchingWithOptions`:

```objectivec
[GMSServices provideAPIKey:@"YOUR_ACTUAL_API_KEY_HERE"];
```

## 🎯 Map Features

### Markers
- **Blue Marker**: User's current location
- **Red/Bus Marker**: Live bus location with custom icon
- **Route Line**: Pink dashed line connecting user to bus

### Controls
- **Zoom**: Pinch to zoom in/out
- **Pan**: Drag to move map
- **Location Button**: Re-center on user location
- **Permission Request**: Automatic location permission handling

### Real-time Updates
- Bus location updates every 5 seconds from Firebase Realtime Database
- Map automatically re-centers to show both user and bus
- Route line updates dynamically with location changes

## 🚀 Usage

1. Navigate to Live Tracking screen from passenger dashboard
2. Grant location permission when prompted
3. View live bus location on map
4. Watch real-time updates as bus moves

## 🔧 Troubleshooting

### Map Not Loading
- Check if Google Maps API key is set correctly
- Verify API key has Maps SDK enabled
- Ensure internet connection is available

### Permission Issues
- Make sure location permissions are granted
- Check if location services are enabled on device
- Verify app has background location permission for tracking

### Performance Issues
- Map updates are optimized to 5-second intervals
- Region calculation minimizes unnecessary re-renders
- Markers are only rendered when location data is available

## 📱 Screen Components

### LiveTrackingScreen.tsx
- **Map Integration**: react-native-maps with Google provider
- **Permission Handling**: Automatic location permission requests
- **Real-time Updates**: Firebase Realtime Database integration
- **Error Handling**: Graceful fallbacks for permission/location errors
- **Loading States**: Proper loading indicators during initialization

### Key Functions
- `requestLocationPermission()`: Handles location permission requests
- `initializeMapRegion()`: Sets up map viewport to show both locations
- `startLocationTracking()`: Subscribes to real-time bus location updates
- `getCurrentLocation()`: Gets user's current GPS location

## 🎨 Styling

- **Map Container**: Rounded corners with shadow
- **Markers**: Custom styled bus icon with shadow
- **Route Line**: Pink dashed line (strokeWidth: 3)
- **Permission UI**: Clean permission request interface
- **Loading States**: Consistent loading indicators

## 🔐 Security Notes

- API key is stored in separate config file
- Console warnings remind developers to set actual API key
- Location data is handled securely through Firebase
- No sensitive information is logged or exposed

## 🚦 Next Steps

1. Set up your Google Maps API key
2. Test the live tracking functionality
3. Verify real-time updates work correctly
4. Test on both Android and iOS devices
5. Monitor API usage in Google Cloud Console

## 📞 Support

For issues with Google Maps integration:
1. Check Google Cloud Console for API usage
2. Verify API key restrictions and quotas
3. Review device location permissions
4. Test with different network conditions
