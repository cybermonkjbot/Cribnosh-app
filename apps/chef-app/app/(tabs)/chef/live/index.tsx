import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { Video, Users, Clock, X } from 'lucide-react-native';

export default function LiveStreamingScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  // Get chef's live sessions
  const liveSessions = useQuery(
    api.queries.liveSessions.getByChefId,
    chef?._id
      ? { chefId: chef._id, status: 'live' }
      : 'skip'
  ) as any[] | undefined;

  const endedSessions = useQuery(
    api.queries.liveSessions.getByChefId,
    chef?._id
      ? { chefId: chef._id, status: 'ended', limit: 10 }
      : 'skip'
  ) as any[] | undefined;


  const endLiveSession = useMutation(api.mutations.liveSessions.endLiveSession);

  const handleStartLiveStream = (sessionId: string) => {
    setIsCameraVisible(false);
      showSuccess('Live Session Started', 'Your live session has been created successfully!');
    // Optionally navigate to the live broadcast screen
    // router.push(`/(tabs)/chef/live/${sessionId}` as any);
  };

  const handleEndSession = async (sessionId: any) => {
    Alert.alert(
      'End Live Session',
      'Are you sure you want to end this live session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await endLiveSession({ sessionId, sessionToken });
              showSuccess('Session Ended', 'Your live session has been ended.');
            } catch (error: any) {
              showError('Error', error.message || 'Failed to end live session');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <GradientBackground>
      <PremiumHeader title="Live Streaming" showInfoButton={false} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Go Live Button - Primary CTA */}
            <TouchableOpacity
          style={styles.goLiveButton}
          onPress={() => setIsCameraVisible(true)}
        >
          <Video size={24} color="#FFFFFF" />
          <Text style={styles.goLiveButtonText}>Go Live</Text>
                    </TouchableOpacity>

        {/* Active Live Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Sessions</Text>
          {liveSessions && liveSessions.length > 0 ? (
            liveSessions.map((session: any) => (
              <View key={session._id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleEndSession(session._id)}
                    style={styles.endButton}
                  >
                    <X size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                {session.description && (
                  <Text style={styles.sessionDescription}>{session.description}</Text>
                )}
                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <Users size={16} color="#666" />
                    <Text style={styles.statText}>{session.viewerCount || 0} viewers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.statText}>
                      {formatDuration(session.actual_start_time || session.scheduled_start_time)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              title="No active live sessions"
              subtitle="Start a new live session to begin streaming"
              icon="videocam-outline"
              actionButton={{
                label: 'Go Live',
                onPress: () => setIsCameraVisible(true)
              }}
              style={{ paddingVertical: 40 }}
            />
          )}
        </View>

        {/* Recent Ended Sessions */}
        {endedSessions && endedSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {endedSessions.map((session: any) => (
              <View key={session._id} style={styles.sessionCard}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                {session.description && (
                  <Text style={styles.sessionDescription}>{session.description}</Text>
                )}
                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <Users size={16} color="#666" />
                    <Text style={styles.statText}>
                      Peak: {session.sessionStats?.peakViewers || session.viewerCount || 0} viewers
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.statText}>
                      {new Date(session.endedAt || session.actual_start_time).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={isCameraVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraVisible(false)}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <CameraModalScreen 
          onClose={() => setIsCameraVisible(false)}
          onStartLiveStream={handleStartLiveStream}
        />
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  goLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sessionCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F44336',
  },
  endButton: {
    padding: 4,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
});

