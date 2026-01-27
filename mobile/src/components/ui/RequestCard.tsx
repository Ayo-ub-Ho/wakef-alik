/**
 * RequestCard - Delivery request card in Stitch style
 * Matches the exact Stitch design:
 * - Image header (16:6 aspect ratio)
 * - Fee left + Distance/ETA right
 * - Pickup/Dropoff with icons
 * - Reject (gray) + Accept Request (yellow) buttons
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/tokens';

interface RequestCardProps {
  /** Restaurant/Store name */
  restaurantName?: string;
  /** Pickup address text */
  pickupAddress: string;
  /** Dropoff address text */
  dropoffAddress: string;
  /** Delivery fee in MAD */
  fee: number;
  /** Distance in km (string, e.g. "2.5") */
  distance?: string;
  /** ETA in minutes (number) */
  etaMinutes?: number;
  /** Image URL (optional) */
  imageUrl?: string;
  /** Accept handler */
  onAccept?: () => void;
  /** Reject handler */
  onReject?: () => void;
  /** View details handler */
  onPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export function RequestCard({
  restaurantName,
  pickupAddress,
  dropoffAddress,
  fee,
  distance = '--',
  etaMinutes,
  imageUrl,
  onAccept,
  onReject,
  onPress,
  loading = false,
  disabled = false,
}: RequestCardProps) {
  const etaText = etaMinutes ? `≈ ${etaMinutes} mins` : '≈ -- mins';

  const content = (
    <>
      {/* Header Image - 16:6 aspect ratio like Stitch */}
      <View style={styles.headerArea}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerPlaceholder}>
            <Text style={styles.placeholderText}>
              {restaurantName || 'Restaurant'}
            </Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Fee + Distance Row */}
        <View style={styles.mainInfoRow}>
          {/* Left: Fee */}
          <View style={styles.feeContainer}>
            <Text style={styles.feeAmount}>{Math.round(fee)} MAD</Text>
            <Text style={styles.feeLabel}>Estimated Earnings</Text>
          </View>
          {/* Right: Distance + ETA */}
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceValue}>{distance} km</Text>
            <Text style={styles.etaValue}>{etaText}</Text>
          </View>
        </View>

        {/* Locations Section with border */}
        <View style={styles.locationsSection}>
          {/* Pickup Row */}
          <View style={styles.locationRow}>
            <Text style={styles.pickupIcon}>🏪</Text>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {restaurantName || pickupAddress}
              </Text>
            </View>
          </View>

          {/* Dropoff Row */}
          <View style={styles.locationRow}>
            <Text style={styles.dropoffIcon}>📍</Text>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>DROP-OFF</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {dropoffAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {(onAccept || onReject) && (
          <View style={styles.actionsRow}>
            {onReject && (
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  (disabled || loading) && styles.buttonDisabled,
                ]}
                onPress={onReject}
                disabled={disabled || loading}
                activeOpacity={0.7}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            )}
            {onAccept && (
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  (disabled || loading) && styles.acceptButtonDisabled,
                ]}
                onPress={onAccept}
                disabled={disabled || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept Request</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.95}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    // Stitch shadow: 0_4px_20px_rgba(0,0,0,0.05)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },

  // Header - 16:6 aspect ratio
  headerArea: {
    aspectRatio: 16 / 6,
    width: '100%',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerPlaceholder: {
    flex: 1,
    backgroundColor: '#e8e8e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.muted,
    opacity: 0.6,
  },

  // Content Section
  contentSection: {
    padding: spacing.xl,
  },

  // Main Info Row (Fee + Distance)
  mainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  feeContainer: {
    flex: 1,
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  feeLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.muted,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distanceValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  etaValue: {
    fontSize: typography.size.sm,
    color: colors.muted,
    marginTop: 2,
  },

  // Locations Section
  locationsSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pickupIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  dropoffIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#9ca3af', // gray-400
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  rejectButton: {
    flex: 1,
    height: 56,
    backgroundColor: colors.bgDark,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  acceptButton: {
    flex: 2,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // Stitch: shadow-lg shadow-primary/20
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonDisabled: {
    backgroundColor: colors.bgDark,
    shadowOpacity: 0,
  },
  acceptButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default RequestCard;
