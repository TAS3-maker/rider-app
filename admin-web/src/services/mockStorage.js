import {
  INITIAL_USERS,
  INITIAL_TRIPS,
  INITIAL_GROUPS,
  INITIAL_EVENT_LOGS,
  INITIAL_SCHOOLS,
  INITIAL_DESTINATIONS,
  INITIAL_PICKUP_LOCATIONS,
  INITIAL_BREAK_DATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_DASHBOARD_STATS
} from "../constants";
const STORAGE_KEYS = {
  USERS: "ridepact_users_v1",
  TRIPS: "ridepact_trips_v1",
  GROUPS: "ridepact_groups_v1",
  EVENTS: "ridepact_events_v1",
  SCHOOLS: "ridepact_schools_v1",
  DESTINATIONS: "ridepact_destinations_v1",
  PICKUPS: "ridepact_pickups_v1",
  BREAKS: "ridepact_breaks_v1",
  NOTIFICATIONS: "ridepact_notifications_v1",
  SETTINGS: "ridepact_settings_v1"
};
function getStored(key, defaultData) {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Failed reading storage key ${key}, falling back to defaults`, err);
    return defaultData;
  }
}
function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed writing storage key ${key}`, err);
  }
}
const MockStorage = {
  // Users
  getUsers: () => getStored(STORAGE_KEYS.USERS, INITIAL_USERS),
  getUserById: (id) => {
    const users = MockStorage.getUsers();
    return users.find((u) => u.id === id);
  },
  updateUserStatus: (id, status) => {
    const users = MockStorage.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    users[idx] = { ...users[idx], status };
    setStored(STORAGE_KEYS.USERS, users);
    MockStorage.addEventLog({
      eventType: "ride_status_changed",
      user: "Admin",
      details: `User ${users[idx].name} status updated to ${status}`,
      source: "admin",
      userId: id
    });
    return users[idx];
  },
  // Trips
  getTrips: () => getStored(STORAGE_KEYS.TRIPS, INITIAL_TRIPS),
  getTripById: (id) => {
    const trips = MockStorage.getTrips();
    return trips.find((t) => t.id === id);
  },
  updateTripStatus: (id, status) => {
    const trips = MockStorage.getTrips();
    const idx = trips.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Trip not found");
    trips[idx] = { ...trips[idx], status };
    setStored(STORAGE_KEYS.TRIPS, trips);
    return trips[idx];
  },
  // Groups
  getGroups: () => getStored(STORAGE_KEYS.GROUPS, INITIAL_GROUPS),
  getGroupById: (id) => {
    const groups = MockStorage.getGroups();
    return groups.find((g) => g.id === id);
  },
  // Events
  getEventLogs: () => getStored(STORAGE_KEYS.EVENTS, INITIAL_EVENT_LOGS),
  addEventLog: (event) => {
    const events = MockStorage.getEventLogs();
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const newLog = {
      ...event,
      id: `evt_${Date.now()}`,
      timestamp: dateStr
    };
    events.unshift(newLog);
    setStored(STORAGE_KEYS.EVENTS, events);
    return newLog;
  },
  // Schools
  getSchools: () => getStored(STORAGE_KEYS.SCHOOLS, INITIAL_SCHOOLS),
  getSchoolById: (id) => {
    const schools = MockStorage.getSchools();
    return schools.find((s) => s.id === id);
  },
  addSchool: (school) => {
    const schools = MockStorage.getSchools();
    const newSchool = {
      ...school,
      id: `sch_${Date.now()}`,
      usersCount: 0,
      ridesCount: 0
    };
    schools.push(newSchool);
    setStored(STORAGE_KEYS.SCHOOLS, schools);
    MockStorage.addEventLog({
      eventType: "ride_status_changed",
      user: "Admin",
      details: `New school configured: ${school.name} (${school.domain})`,
      source: "admin"
    });
    return newSchool;
  },
  updateSchool: (id, updates) => {
    const schools = MockStorage.getSchools();
    const idx = schools.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("School not found");
    schools[idx] = { ...schools[idx], ...updates };
    setStored(STORAGE_KEYS.SCHOOLS, schools);
    return schools[idx];
  },
  // Destinations
  getDestinations: () => getStored(STORAGE_KEYS.DESTINATIONS, INITIAL_DESTINATIONS),
  addDestination: (dest) => {
    const destinations = MockStorage.getDestinations();
    const newDest = {
      ...dest,
      id: `dst_${Date.now()}`
    };
    destinations.push(newDest);
    setStored(STORAGE_KEYS.DESTINATIONS, destinations);
    return newDest;
  },
  updateDestination: (id, updates) => {
    const destinations = MockStorage.getDestinations();
    const idx = destinations.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Destination not found");
    destinations[idx] = { ...destinations[idx], ...updates };
    setStored(STORAGE_KEYS.DESTINATIONS, destinations);
    return destinations[idx];
  },
  // Pickups
  getPickupLocations: () => getStored(STORAGE_KEYS.PICKUPS, INITIAL_PICKUP_LOCATIONS),
  addPickupLocation: (pickup) => {
    const pickups = MockStorage.getPickupLocations();
    const newPickup = {
      ...pickup,
      id: `pic_${Date.now()}`
    };
    pickups.push(newPickup);
    setStored(STORAGE_KEYS.PICKUPS, pickups);
    return newPickup;
  },
  updatePickupLocation: (id, updates) => {
    const pickups = MockStorage.getPickupLocations();
    const idx = pickups.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pickup location not found");
    pickups[idx] = { ...pickups[idx], ...updates };
    setStored(STORAGE_KEYS.PICKUPS, pickups);
    return pickups[idx];
  },
  // Break Calendar
  getBreakDates: () => getStored(STORAGE_KEYS.BREAKS, INITIAL_BREAK_DATES),
  addBreakDate: (breakDate) => {
    const breaks = MockStorage.getBreakDates();
    const newBreak = {
      ...breakDate,
      id: `brk_${Date.now()}`
    };
    breaks.push(newBreak);
    setStored(STORAGE_KEYS.BREAKS, breaks);
    return newBreak;
  },
  updateBreakDate: (id, updates) => {
    const breaks = MockStorage.getBreakDates();
    const idx = breaks.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Break date not found");
    breaks[idx] = { ...breaks[idx], ...updates };
    setStored(STORAGE_KEYS.BREAKS, breaks);
    return breaks[idx];
  },
  triggerBreakNotification: (id, type) => {
    const breaks = MockStorage.getBreakDates();
    const idx = breaks.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Break date not found");
    const item = breaks[idx];
    if (type === "14d") item.notification14dSent = true;
    if (type === "3d") item.notification3dSent = true;
    MockStorage.addNotification({
      title: `Travel Reminder: ${item.event} is approaching`,
      message: `Coordinate shared rides with verified ${item.schoolName} students for ${item.event} (${item.start} - ${item.end}).`,
      school: item.schoolName,
      audience: `All ${item.schoolName} students`,
      target: `${item.schoolName} \xB7 All (247)`,
      opened: "Just sent",
      tripsCreated: "0 trips",
      deliveredCount: 247,
      totalAudience: 247,
      deliveryRate: "100%",
      status: "Sent"
    });
    setStored(STORAGE_KEYS.BREAKS, breaks);
    return breaks[idx];
  },
  // Notifications
  getNotifications: () => getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  addNotification: (notif) => {
    const notifications = MockStorage.getNotifications();
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const newNotif = {
      ...notif,
      id: `ntf_${Date.now()}`,
      date: dateStr,
      target: notif.target || `${notif.school || "UMich"} \xB7 ${notif.audience || "All (247)"}`,
      opened: notif.opened || "Just sent \xB7 0 opens",
      tripsCreated: notif.tripsCreated || "0 trips",
      status: "Sent"
    };
    notifications.unshift(newNotif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotif;
  },
  // Settings
  getSettings: () => getStored(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  updateSettings: (settings) => {
    const updated = {
      ...settings,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    setStored(STORAGE_KEYS.SETTINGS, updated);
    MockStorage.addEventLog({
      eventType: "ride_status_changed",
      user: "Admin",
      details: "Platform settings updated (matching window, capacity & booker discounts)",
      source: "admin"
    });
    return updated;
  },
  resetSettings: () => {
    setStored(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  },
  // Dashboard Stats
  getDashboardStats: () => {
    const users = MockStorage.getUsers();
    const trips = MockStorage.getTrips();
    const activeTripsCount = trips.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length;
    const completedTripsCount = trips.filter((t) => t.status === "Completed").length;
    return {
      ...INITIAL_DASHBOARD_STATS,
      totalUsers: users.length > 0 ? 247 + (users.length - INITIAL_USERS.length) : 247,
      activeTrips: activeTripsCount > 0 ? activeTripsCount : 89,
      completedRides: completedTripsCount > 0 ? completedTripsCount : 42
    };
  },
  // Reset to initial defaults
  resetAll: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
};
export {
  MockStorage
};
