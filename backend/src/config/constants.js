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
    FARE_CONFIRMATION: 'fare_confirmation',
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
    RIDE_STATUS_CHANGED: 'ride_status_changed',
    RIDE_COMPLETED: 'ride_completed',
    RIDE_CANCELLED: 'ride_cancelled',
    FARE_CONFIRMATION: 'fare_confirmation',
    RATING_SUBMITTED: 'rating_submitted',
  },

  DEFAULTS: {
    GROUP_CAPACITY: 4,
    MATCH_WINDOW_MINUTES: 120,
  },
};
