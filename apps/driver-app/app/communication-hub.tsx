import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useFleetMembership } from '../hooks/useFleetMembership';

export default function CommunicationHubScreen() {
  const router = useRouter();
  const { isPartOfFleet, isLoading: fleetLoading } = useFleetMembership();
  const [selectedTab, setSelectedTab] = useState('messages');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check fleet membership and redirect if not part of fleet
  useEffect(() => {
    if (!fleetLoading && !isPartOfFleet) {
      Alert.alert(
        'Access Restricted',
        'This feature is only available to drivers who are part of a fleet. Please contact your fleet manager if you believe this is an error.',
        [
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [isPartOfFleet, fleetLoading, router]);

  const tabs = [
    { value: 'messages', label: 'Messages', icon: 'chatbubbles' as React.ComponentProps<typeof Ionicons>['name'] },
    { value: 'support', label: 'Support', icon: 'help-circle' as React.ComponentProps<typeof Ionicons>['name'] },
    { value: 'announcements', label: 'Announcements', icon: 'megaphone' as React.ComponentProps<typeof Ionicons>['name'] },
    { value: 'emergency', label: 'Emergency', icon: 'warning' as React.ComponentProps<typeof Ionicons>['name'] },
  ] as const;

  const messages = [
    {
      id: 1,
      sender: 'Fleet Manager',
      message: 'Route update: Avoid Main Street due to construction',
      timestamp: '2 min ago',
      type: 'route_update',
      read: false,
    },
    {
      id: 2,
      sender: 'Customer Service',
      message: 'Customer feedback: Excellent service!',
      timestamp: '15 min ago',
      type: 'feedback',
      read: true,
    },
    {
      id: 3,
      sender: 'System',
      message: 'Your earnings for today: ₦2,450',
      timestamp: '1 hour ago',
      type: 'earnings',
      read: true,
    },
  ];

  const supportTickets = [
    {
      id: 1,
      title: 'Payment Issue',
      status: 'open',
      priority: 'high',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      title: 'App Bug Report',
      status: 'in_progress',
      priority: 'medium',
      timestamp: '1 day ago',
    },
    {
      id: 3,
      title: 'Feature Request',
      status: 'resolved',
      priority: 'low',
      timestamp: '3 days ago',
    },
  ];

  const announcements = [
    {
      id: 1,
      title: 'New Safety Protocol',
      content: 'Please review the updated safety guidelines in your driver app',
      timestamp: '2 hours ago',
      urgent: true,
    },
    {
      id: 2,
      title: 'Holiday Schedule',
      content: 'Special holiday rates will be active from Dec 24-26',
      timestamp: '1 day ago',
      urgent: false,
    },
    {
      id: 3,
      title: 'App Update Available',
      content: 'Update to version 2.1.0 for improved performance',
      timestamp: '2 days ago',
      urgent: false,
    },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      Alert.alert('Message Sent', 'Your message has been sent successfully!');
      setMessageText('');
    }
  };

  const handleCreateTicket = () => {
    Alert.alert('Create Ticket', 'Support ticket created successfully!');
  };

  const handleEmergencyCall = () => {
    Alert.alert('Emergency', 'Emergency services have been notified!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.light.error;
      case 'in_progress': return Colors.light.warning;
      case 'resolved': return Colors.light.accent;
      default: return Colors.light.icon;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.light.error;
      case 'medium': return Colors.light.warning;
      case 'low': return Colors.light.accent;
      default: return Colors.light.icon;
    }
  };

  const getMessageTypeIcon = (type: string): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
      case 'route_update': return 'map';
      case 'feedback': return 'star';
      case 'earnings': return 'cash';
      default: return 'chatbubble';
    }
  };

  // Show loading state while checking fleet membership
  if (fleetLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Checking access...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render content if not part of fleet (alert will show)
  if (!isPartOfFleet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed" size={64} color={Colors.light.icon} />
          <ThemedText type="subtitle" style={styles.accessDeniedTitle}>
            Access Restricted
          </ThemedText>
          <ThemedText style={styles.accessDeniedMessage}>
            This feature is only available to drivers who are part of a fleet.
          </ThemedText>
          <TouchableOpacity style={styles.accessDeniedBackButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Communication Hub</ThemedText>
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
          <Ionicons name="warning" size={24} color={Colors.light.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Tab Navigation */}
        <ThemedView style={styles.section}>
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.tabButton,
                  selectedTab === tab.value && styles.tabButtonActive
                ]}
                onPress={() => setSelectedTab(tab.value)}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={20} 
                  color={selectedTab === tab.value ? Colors.light.primary : Colors.light.icon} 
                />
                <ThemedText style={[
                  styles.tabButtonText,
                  selectedTab === tab.value && styles.tabButtonTextActive
                ]}>
                  {tab.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Search Bar */}
        <ThemedView style={styles.section}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.light.icon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor={Colors.light.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </ThemedView>

        {/* Messages Tab */}
        {selectedTab === 'messages' && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Messages</ThemedText>
            <View style={styles.messagesContainer}>
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={64} color={Colors.light.icon} />
                  <ThemedText style={styles.emptyTitle}>No Messages Yet</ThemedText>
                  <ThemedText style={styles.emptyMessage}>
                    Messages from fleet management, customers, and system will appear here
                  </ThemedText>
                </View>
              ) : (
                messages.map((message) => (
                  <TouchableOpacity key={message.id} style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <View style={styles.messageSender}>
                      <Ionicons 
                        name={getMessageTypeIcon(message.type)} 
                        size={20} 
                        color={Colors.light.primary} 
                      />
                      <ThemedText style={styles.senderName}>{message.sender}</ThemedText>
                    </View>
                    <View style={styles.messageMeta}>
                      <ThemedText style={styles.timestamp}>{message.timestamp}</ThemedText>
                      {!message.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                  <ThemedText style={styles.messageContent}>{message.message}</ThemedText>
                </TouchableOpacity>
              )))}
            </View>
            
            {/* Send Message */}
            <View style={styles.sendMessageContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your message..."
                placeholderTextColor={Colors.light.icon}
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Ionicons name="send" size={20} color={Colors.light.background} />
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {/* Support Tab */}
        {selectedTab === 'support' && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Support Tickets</ThemedText>
            <View style={styles.ticketsContainer}>
              {supportTickets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="help-circle-outline" size={64} color={Colors.light.icon} />
                  <ThemedText style={styles.emptyTitle}>No Support Tickets</ThemedText>
                  <ThemedText style={styles.emptyMessage}>
                    Create a ticket to get help with issues or inquiries
                  </ThemedText>
                </View>
              ) : (
                supportTickets.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <ThemedText style={styles.ticketTitle}>{ticket.title}</ThemedText>
                    <View style={styles.ticketBadges}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                        <ThemedText style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                          {ticket.status.toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '20' }]}>
                        <ThemedText style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                          {ticket.priority.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={styles.ticketTimestamp}>{ticket.timestamp}</ThemedText>
                </View>
              )))}
            </View>
            
            <TouchableOpacity style={styles.createTicketButton} onPress={handleCreateTicket}>
              <Ionicons name="add" size={20} color={Colors.light.background} />
              <ThemedText style={styles.createTicketText}>Create New Ticket</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Announcements Tab */}
        {selectedTab === 'announcements' && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Announcements</ThemedText>
            <View style={styles.announcementsContainer}>
              {announcements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="megaphone-outline" size={64} color={Colors.light.icon} />
                  <ThemedText style={styles.emptyTitle}>No Announcements</ThemedText>
                  <ThemedText style={styles.emptyMessage}>
                    Important announcements from fleet management will appear here
                  </ThemedText>
                </View>
              ) : (
                announcements.map((announcement) => (
                  <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <ThemedText style={styles.announcementTitle}>{announcement.title}</ThemedText>
                    {announcement.urgent && (
                      <View style={styles.urgentBadge}>
                        <Ionicons name="warning" size={16} color={Colors.light.error} />
                        <ThemedText style={styles.urgentText}>URGENT</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.announcementContent}>{announcement.content}</ThemedText>
                  <ThemedText style={styles.announcementTimestamp}>{announcement.timestamp}</ThemedText>
                </View>
              )))}
            </View>
          </ThemedView>
        )}

        {/* Emergency Tab */}
        {selectedTab === 'emergency' && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Emergency Contacts</ThemedText>
            <View style={styles.emergencyContainer}>
              <TouchableOpacity style={styles.emergencyCard} onPress={handleEmergencyCall}>
                <Ionicons name="call" size={32} color={Colors.light.error} />
                <ThemedText style={styles.emergencyTitle}>Emergency Services</ThemedText>
                <ThemedText style={styles.emergencyNumber}>911</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.emergencyCard}>
                <Ionicons name="car" size={32} color={Colors.light.warning} />
                <ThemedText style={styles.emergencyTitle}>Roadside Assistance</ThemedText>
                <ThemedText style={styles.emergencyNumber}>+234 800 123 4567</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.emergencyCard}>
                <Ionicons name="shield" size={32} color={Colors.light.accent} />
                <ThemedText style={styles.emergencyTitle}>Fleet Security</ThemedText>
                <ThemedText style={styles.emergencyNumber}>+234 800 765 4321</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emergencyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.light.text,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  tabButtonTextActive: {
    color: Colors.light.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  messagesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  messageCard: {
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSender: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.icon,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  messageContent: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sendMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  ticketsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  ticketCard: {
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ticketTimestamp: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  createTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  createTicketText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.background,
  },
  announcementsContainer: {
    gap: 12,
  },
  announcementCard: {
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.error,
  },
  announcementContent: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementTimestamp: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  emergencyContainer: {
    gap: 16,
  },
  emergencyCard: {
    padding: 20,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emergencyNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  bottomSpacing: {
    height: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.icon,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  accessDeniedMessage: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  accessDeniedBackButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
