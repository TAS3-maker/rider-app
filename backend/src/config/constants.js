// Shared enums / defaults used across the ride coordination domain.
module.exports = {
  ROLES: { STUDENT: 'student', ADMIN: 'admin' },

  RIDE_DIRECTION: {
    UNIVERSITY_TO_AIRPORT: 'university_to_airport',
    AIRPORT_TO_UNIVERSITY: 'airport_to_university',
  },

  RIDE_STATUS: {
    DRAFT: 'draft',
    OPEN: 'open',
    MATCHED: 'matched',
    GROUPED: 'grouped',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  GROUP_STATUS: {
    OPEN: 'open',
    NEARLY_FULL: 'nearly_full',
    FULL: 'full',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  MEMBER_ROLE: { MEMBER: 'member', BOOKER: 'booker' },

  MESSAGE_TYPE: { TEXT: 'text', SYSTEM: 'system' },

  TRAVEL_EVENT_TYPE: { HOLIDAY: 'holiday', PEAK: 'peak', EXAM: 'exam', OTHER: 'other' },

  NOTIFICATION_TYPE: {
    RIDE_MATCH: 'ride_match',
    GROUP_CREATED: 'group_created',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    CHAT_MESSAGE: 'chat_message',
    RIDE_STATUS: 'ride_status',
    RIDE_REMINDER: 'ride_reminder',
    BOOKING_REMINDER: 'booking_reminder',
    BOOKER_NEEDED: 'booker_needed',
    BOOKER_ASSIGNED: 'booker_assigned',
    GROUP_BOOKED: 'group_booked',
    FARE_CONFIRMATION: 'fare_confirmation',
    FARE_ENTERED: 'fare_entered',
    FARE_CHANGED: 'fare_changed',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    PAYMENT_OVERDUE: 'payment_overdue',
    CAB_CANCELLED: 'cab_cancelled',
    REMATCH_NEEDED: 'rematch_needed',
    RIDE_CANCELLED: 'ride_cancelled',
    RATING_REMINDER: 'rating_reminder',
    ANNOUNCEMENT: 'announcement',
  },

  EVENT_LOG_TYPE: {
    RIDE_CREATED: 'ride_created',
    RIDE_UPDATED: 'ride_updated',
    RIDE_MATCHED: 'ride_matched',
    GROUP_CREATED: 'group_created',
    RIDER_JOINED: 'rider_joined',
    RIDER_LEFT: 'rider_left',
    BOOKER_ASSIGNED: 'booker_assigned',
    BOOKER_TRANSFERRED: 'booker_transferred',
    BOOKER_VACANT: 'booker_vacant',
    GROUP_BOOKED: 'group_booked',
    RIDE_STATUS_CHANGED: 'ride_status_changed',
    GROUP_STATUS_CHANGED: 'group_status_changed',
    RIDE_COMPLETED: 'ride_completed',
    RIDE_CANCELLED: 'ride_cancelled',
    GROUP_CANCELLED: 'group_cancelled',
    CAB_CANCELLED: 'cab_cancelled',
    REMATCH_FLAGGED: 'rematch_flagged',
    FARE_ENTERED: 'fare_entered',
    FARE_CHANGED: 'fare_changed',
    FARE_CONFIRMATION: 'fare_confirmation',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    PAYMENT_OVERDUE: 'payment_overdue',
    RATING_SUBMITTED: 'rating_submitted',
  },

  GROUP_TYPE: { PUBLIC: 'public', PRIVATE: 'private' },

  PICKUP_MODE: { MEET_POINT: 'meet_point', MULTI_STOP: 'multi_stop' },

  DEFAULTS: {
    GROUP_CAPACITY: 4,
    MATCH_WINDOW_MINUTES: 120,
    // Depart this many minutes before the earliest flight in the group.
    DEPARTURE_BUFFER_MINUTES: 165,
    // Booking deadline is this many minutes before suggested departure.
    BOOKING_BUFFER_MINUTES: 120,
    // Overdue grace period (minutes) after ride completion before unpaid shares flag.
    PAYMENT_GRACE_MINUTES: 1440,
    // Standard sedan seats vs large vehicle seats.
    VEHICLE_STANDARD_SEATS: 4,
    VEHICLE_LARGE_SEATS: 6,
    // Bags-per-vehicle threshold that bumps the suggestion to a larger vehicle.
    LARGE_VEHICLE_BAG_THRESHOLD: 4,
    // Solo cab fare estimate fallback (USD) when an airport has no baseFare.
    DEFAULT_SOLO_FARE: 57,
  },
};
