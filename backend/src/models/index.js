// Barrel export for all Mongoose models.
module.exports = {
  User: require('./User'),
  University: require('./University'),
  Airport: require('./Airport'),
  Destination: require('./Destination'),
  Ride: require('./Ride'),
  RideGroup: require('./RideGroup'),
  GroupMember: require('./GroupMember'),
  Message: require('./Message'),
  Rating: require('./Rating'),
  FareRecord: require('./FareRecord'),
  Notification: require('./Notification'),
  TravelEvent: require('./TravelEvent'),
  PlatformSetting: require('./PlatformSetting'),
  EventLog: require('./EventLog'),
};
