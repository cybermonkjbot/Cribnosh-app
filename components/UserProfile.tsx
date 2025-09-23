import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUser } from '../hooks/useAuthState';

interface UserProfileProps {
  showAvatar?: boolean;
  showEmail?: boolean;
  showRoles?: boolean;
}

/**
 * Example component showing how to use the useUser hook
 * to display user information throughout the app
 */
export const UserProfile: React.FC<UserProfileProps> = ({ 
  showAvatar = true, 
  showEmail = true, 
  showRoles = false 
}) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading user...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.noUserText}>No user data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        {showAvatar && user.picture && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{user.name}</Text>
          
          {showEmail && (
            <Text style={styles.emailText}>{user.email}</Text>
          )}
          
          {showRoles && user.roles && user.roles.length > 0 && (
            <Text style={styles.rolesText}>
              {user.roles.join(', ')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: '#E5E7EB',
    opacity: 0.8,
  },
  rolesText: {
    fontSize: 12,
    color: '#4ADE80',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  noUserText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
});
