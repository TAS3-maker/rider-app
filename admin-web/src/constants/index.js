const WIREFRAME_SCREENS = [
  { id: "s-dash", path: "/dashboard", label: "Dashboard", icon: "\u{1F4CA}", section: "Overview" },
  { id: "s-users", path: "/users", label: "Users", icon: "\u{1F464}", section: "Manage" },
  { id: "s-trips", path: "/trips", label: "Trips", icon: "\u{1F697}", section: "Manage" },
  { id: "s-groups", path: "/groups", label: "Groups", icon: "\u{1F465}", section: "Manage" },
  { id: "s-events", path: "/events", label: "Event Logs", icon: "\u{1F4CB}", section: "Manage" },
  { id: "s-schools", path: "/schools", label: "Schools", icon: "\u{1F3EB}", section: "Configure" },
  { id: "s-dest", path: "/destinations", label: "Destinations", icon: "\u{1F4CD}", section: "Configure" },
  { id: "s-pickups", path: "/pickups", label: "Pickup Locations", icon: "\u{1F4CC}", section: "Configure" },
  { id: "s-calendar", path: "/calendar", label: "Break Calendar", icon: "\u{1F4C5}", section: "Configure" },
  { id: "s-notif", path: "/notifications", label: "Notifications", icon: "\u{1F514}", section: "Communicate" },
  { id: "s-settings", path: "/settings", label: "Platform Settings", icon: "\u2699\uFE0F", section: "Settings" }
];
const WIREFRAME_ANNOTATIONS = {
  "s-dash": {
    title: "Dashboard",
    notes: "Top row: 4 KPI cards matching success metrics from tech brief. Second row: secondary metrics. Charts visualize ride trends, direction split, and break demand. Real-time platform data updates with multi-school filtering capability."
  },
  "s-users": {
    title: "User Management",
    notes: "Shows all registered users with email, school, ride count, reliability rating, payment handle, and verification status. Search by name or email. Export CSV for analytics. Clicking a user row expands to full profile, ride history, and ratings received."
  },
  "s-trips": {
    title: "Trip Management",
    notes: "All trips with filters for status and direction. Each row shows trip ID, route, date, flight time, rider count, status badge, and booker. Clicking a row shows full trip details including all riders, group chat history, and fare split."
  },
  "s-groups": {
    title: "Group Monitoring",
    notes: "Active and historical groups. Shows group type (Public/Private), rider names, booker, vehicle suggestion, fare (estimated or actual), and status. Links to associated trip with realtime communication & timeline inspection."
  },
  "s-events": {
    title: "Event Logs",
    notes: "CRITICAL: This is the analytics + future ML training data. Every user action logged with timestamp. Filterable by event type. Exportable as CSV. Event types: trip_created, group_joined, rider_left, booker_reassigned, ride_booked, ride_completed, ride_cancelled, payment_sent, payment_received, rating_submitted, user_flaked. This data feeds future AI matching model."
  },
  "s-schools": {
    title: "School Configuration",
    notes: 'Adding a new school = creating a new record here. No code changes required. Each school has its own .edu domain, destinations, pickup presets, break calendar, and solo fare estimate. "Draft" status means configured but not yet live to students.'
  },
  "s-dest": {
    title: "Destinations",
    notes: "Airport destinations per school. Each destination has terminals (for return rides \u2014 rider selects terminal). Directions toggle controls whether the route supports to_airport, from_airport, or both. Zero code changes needed for new destinations."
  },
  "s-pickups": {
    title: "Pickup Locations",
    notes: 'Preset campus meeting points for shared pickup mode. Area tag is informational only (NOT used for matching). These appear as options when the booker selects "Shared Pickup" in the mobile app. Adding/editing locations is admin-only.'
  },
  "s-calendar": {
    title: "Break Calendar",
    notes: 'Break dates drive two features: (1) the mobile app calendar with live demand counts, and (2) automated push notifications at 14 days and 3 days before each break. Admin adds dates here \u2192 they appear on mobile automatically. "Notif Sent" column tracks notification delivery status.'
  },
  "s-notif": {
    title: "Broadcast Notifications",
    notes: "Admin can send custom push notifications to all users or filtered by school. Includes compose form (title, message, audience, timing) and sent history with delivery rates. Used for announcements, new school launches, or promotional pushes beyond automated break calendar alerts."
  },
  "s-settings": {
    title: "Platform Settings",
    notes: "Global configuration: matching window (90 min default), max riders (4 default), booking deadline buffer, airport buffer, booker discount percentages per group size. Also terms/privacy URLs. These values are referenced by the matching engine and fare split logic \u2014 changing them here changes app behavior without code deployment."
  }
};
const INITIAL_SETTINGS = {
  maxGroupSize: 4,
  matchingTimeWindowMinutes: 90,
  bookerDiscountAmount: 5,
  airportArrivalBufferMinutes: 150,
  notificationTriggers: {
    break14d: true,
    break3d: true,
    riderAdded: true,
    groupFull: true,
    flightReminder3h: true,
    reimbursement2h: true
  },
  adminAccounts: [
    {
      id: "adm_1",
      email: "lakshya@techarchsoftwares.in",
      role: "Super Admin \xB7 Full access"
    },
    {
      id: "adm_2",
      email: "admin@ridepact.com",
      role: "Admin \xB7 School management"
    }
  ],
  platformName: "RidePact",
  supportEmail: "support@ridepact.com",
  flightTimeWindowMinutes: 90,
  maxRidersPerGroup: 4,
  bookingDeadlineBufferMinutes: 120,
  airportBufferMinutes: 150,
  bookerDiscount2Riders: 45,
  bookerDiscount3Riders: 30,
  bookerDiscount4Riders: 20,
  termsOfServiceUrl: "https://ridepact.com/terms",
  privacyPolicyUrl: "https://ridepact.com/privacy",
  lastUpdated: "2026-08-28T14:30:00Z"
};
const INITIAL_USERS = [
  {
    id: "usr_001",
    name: "Sarah K.",
    email: "sk@umich.edu",
    school: "UMich",
    schoolId: "sch_umich",
    phone: "+1 (734) 555-0192",
    venmoHandle: "@sarah_venmo",
    paymentHandle: "@sarah_venmo",
    ridesCount: 8,
    completedRidesCount: 8,
    cancelledRidesCount: 0,
    reliabilityRating: 4.8,
    punctualityRating: 4.9,
    status: "active",
    verificationStatus: "verified",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Sep 12, 2026",
    luggagePreference: "1 Carry-on + 1 Backpack",
    pickupPreference: "Michigan Union",
    notes: "Frequent reliable booker with preferred UberXL rating",
    ratingsReceived: [
      {
        id: "rat_1",
        fromUser: "Alex J.",
        toUser: "Sarah K.",
        reliability: 5,
        punctuality: 5,
        comment: "Super organized booker, coordinated Uber on time!",
        tripId: "#T-0035",
        createdAt: "Oct 19, 2026"
      },
      {
        id: "rat_2",
        fromUser: "Mike T.",
        toUser: "Sarah K.",
        reliability: 5,
        punctuality: 4.8,
        comment: "Great ride to DTW McNamara terminal.",
        tripId: "#T-0025",
        createdAt: "Oct 02, 2026"
      }
    ]
  },
  {
    id: "usr_002",
    name: "Alex J.",
    email: "aj@umich.edu",
    school: "UMich",
    schoolId: "sch_umich",
    phone: "+1 (734) 555-0144",
    zelleHandle: "@alex_zelle",
    paymentHandle: "@alex_zelle",
    ridesCount: 5,
    completedRidesCount: 5,
    cancelledRidesCount: 0,
    reliabilityRating: 4.5,
    punctualityRating: 4.6,
    status: "active",
    verificationStatus: "verified",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Sep 18, 2026",
    luggagePreference: "1 Checked bag",
    pickupPreference: "Pierpont Commons",
    notes: "Regular engineering campus rider",
    ratingsReceived: [
      {
        id: "rat_3",
        fromUser: "Sarah K.",
        toUser: "Alex J.",
        reliability: 5,
        punctuality: 4,
        comment: "Arrived at pickup spot right on time with exact Venmo payment.",
        tripId: "#T-0035",
        createdAt: "Nov 20, 2026"
      }
    ]
  },
  {
    id: "usr_003",
    name: "Mike T.",
    email: "mt@umich.edu",
    school: "UMich",
    schoolId: "sch_umich",
    phone: "+1 (734) 555-0873",
    venmoHandle: "@mike_venmo",
    paymentHandle: "@mike_venmo",
    ridesCount: 2,
    completedRidesCount: 2,
    cancelledRidesCount: 1,
    reliabilityRating: 3.2,
    punctualityRating: 3.5,
    status: "active",
    verificationStatus: "verified",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Oct 01, 2026",
    luggagePreference: "2 Checked bags",
    pickupPreference: "Central Off-Campus",
    notes: "Late to pickup once, reminder sent",
    ratingsReceived: [
      {
        id: "rat_4",
        fromUser: "Dave L.",
        toUser: "Mike T.",
        reliability: 3,
        punctuality: 3,
        comment: "Was 7 minutes late for Uber departure.",
        tripId: "#T-0024",
        createdAt: "Nov 21, 2026"
      }
    ]
  },
  {
    id: "usr_004",
    name: "Priya R.",
    email: "pr@umich.edu",
    school: "UMich",
    schoolId: "sch_umich",
    phone: "+1 (734) 555-0321",
    venmoHandle: "@priya_v",
    paymentHandle: "@priya_v",
    ridesCount: 0,
    completedRidesCount: 0,
    cancelledRidesCount: 0,
    reliabilityRating: null,
    punctualityRating: null,
    status: "inactive",
    verificationStatus: "unverified",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Nov 19, 2026",
    luggagePreference: "1 Carry-on",
    pickupPreference: "Michigan Union",
    notes: "Awaiting .edu email confirmation token verification",
    ratingsReceived: []
  },
  {
    id: "usr_005",
    name: "Dave L.",
    email: "dl@umich.edu",
    school: "UMich",
    schoolId: "sch_umich",
    phone: "+1 (734) 555-0961",
    venmoHandle: "@dave_l",
    paymentHandle: "@dave_l",
    ridesCount: 3,
    completedRidesCount: 2,
    cancelledRidesCount: 1,
    reliabilityRating: 2.1,
    punctualityRating: 2,
    status: "inactive",
    verificationStatus: "verified",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Oct 14, 2026",
    luggagePreference: "1 Carry-on",
    pickupPreference: "Michigan Union",
    notes: "Flagged for flaking on Group #G-024 without notice",
    ratingsReceived: []
  },
  {
    id: "usr_006",
    name: "Chloe M.",
    email: "cm@umich.edu",
    school: "UMich",
    schoolId: "sch_umich",
    phone: "+1 (734) 555-0722",
    venmoHandle: "@chloe_m",
    paymentHandle: "@chloe_m",
    ridesCount: 4,
    completedRidesCount: 4,
    cancelledRidesCount: 0,
    reliabilityRating: 4.9,
    punctualityRating: 5,
    status: "active",
    verificationStatus: "verified",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    joinedDate: "Oct 04, 2026",
    luggagePreference: "1 Backpack",
    pickupPreference: "Pierpont Commons",
    notes: "Exemplary punctuality record",
    ratingsReceived: []
  }
];
const INITIAL_TRIPS = [
  {
    id: "#T-0042",
    route: "UMich \u2192 DTW",
    school: "UMich",
    schoolId: "sch_umich",
    destination: "Detroit Metro Airport",
    airportCode: "DTW",
    direction: "to_airport",
    date: "Nov 24, 2026",
    flightTime: "5:15 PM",
    flightNumber: "DL 1422",
    pickupLocation: "Michigan Union",
    ridersCount: 2,
    maxCapacity: 4,
    status: "Open",
    bookerName: "Sarah K.",
    bookerId: "usr_001",
    groupId: "#G-028",
    fareEstimate: 57,
    luggageInfo: "2 Carry-ons, 1 Backpack",
    notes: "Delta flight to LGA, terminal McNamara",
    createdAt: "2026-11-22T10:30:00Z"
  },
  {
    id: "#T-0041",
    route: "UMich \u2192 DTW",
    school: "UMich",
    schoolId: "sch_umich",
    destination: "Detroit Metro Airport",
    airportCode: "DTW",
    direction: "to_airport",
    date: "Nov 24, 2026",
    flightTime: "4:00 PM",
    flightNumber: "UA 892",
    pickupLocation: "Pierpont Commons",
    ridersCount: 3,
    maxCapacity: 4,
    status: "Nearly Full",
    bookerName: "Mike T.",
    bookerId: "usr_003",
    groupId: "#G-027",
    fareEstimate: 62,
    luggageInfo: "3 Checked bags, 2 Backpacks",
    notes: "Needs UberXL due to heavy luggage",
    createdAt: "2026-11-21T18:15:00Z"
  },
  {
    id: "#T-0039",
    route: "DTW \u2192 UMich",
    school: "UMich",
    schoolId: "sch_umich",
    destination: "University of Michigan",
    airportCode: "DTW",
    direction: "from_airport",
    date: "Nov 28, 2026",
    flightTime: "Land 3:30 PM",
    terminal: "McNamara Terminal",
    pickupLocation: "Passenger Pickup Level 2",
    ridersCount: 4,
    maxCapacity: 4,
    status: "Full",
    bookerName: "Alex J.",
    bookerId: "usr_002",
    groupId: "#G-026",
    fareEstimate: 64,
    luggageInfo: "4 Carry-ons",
    notes: "Return trip after Thanksgiving recess",
    createdAt: "2026-11-20T14:20:00Z"
  },
  {
    id: "#T-0035",
    route: "UMich \u2192 DTW",
    school: "UMich",
    schoolId: "sch_umich",
    destination: "Detroit Metro Airport",
    airportCode: "DTW",
    direction: "to_airport",
    date: "Oct 19, 2026",
    flightTime: "2:00 PM",
    flightNumber: "AA 2104",
    pickupLocation: "Michigan Union",
    ridersCount: 3,
    maxCapacity: 4,
    status: "Completed",
    bookerName: "Sarah K.",
    bookerId: "usr_001",
    groupId: "#G-025",
    fareEstimate: 52,
    actualFare: 48,
    luggageInfo: "3 Carry-ons",
    notes: "Completed during Fall Study Break. All payments confirmed.",
    createdAt: "2026-10-15T09:00:00Z"
  },
  {
    id: "#T-0034",
    route: "UMich \u2192 DTW",
    school: "UMich",
    schoolId: "sch_umich",
    destination: "Detroit Metro Airport",
    airportCode: "DTW",
    direction: "to_airport",
    date: "Oct 18, 2026",
    flightTime: "11:30 AM",
    pickupLocation: "Central Off-Campus",
    ridersCount: 2,
    maxCapacity: 4,
    status: "Cancelled",
    bookerName: "Dave L.",
    bookerId: "usr_005",
    fareEstimate: 55,
    notes: "Cancelled because booker was unresponsive before deadline buffer.",
    createdAt: "2026-10-14T11:00:00Z"
  }
];
const INITIAL_GROUPS = [
  {
    id: "#G-028",
    tripId: "#T-0042",
    type: "Public",
    riders: [
      {
        userId: "usr_001",
        name: "Sarah K.",
        email: "sk@umich.edu",
        paymentHandle: "@sarah_venmo",
        isBooker: true,
        paymentStatus: "confirmed",
        shareAmount: 25.65,
        // gets 45% discount as booker of 2 riders ($57 total -> $25.65 vs $31.35)
        joinedAt: "2026-11-22T10:30:00Z"
      },
      {
        userId: "usr_002",
        name: "Alex J.",
        email: "aj@umich.edu",
        paymentHandle: "@alex_zelle",
        isBooker: false,
        paymentStatus: "pending",
        shareAmount: 31.35,
        joinedAt: "2026-11-22T10:42:00Z"
      }
    ],
    ridersSummary: "Sarah K., Alex J.",
    bookerId: "usr_001",
    bookerName: "Sarah K.",
    vehicleSuggestion: "UberX",
    fare: 57,
    fareType: "estimated",
    status: "Forming",
    bookingStatus: "Booking Required",
    capacity: "2/4",
    maxCapacity: 4,
    chatMessages: [
      {
        id: "msg_1",
        senderId: "usr_001",
        senderName: "Sarah K.",
        senderRole: "booker",
        content: "Hey Alex! I'll call the UberX around 2:45 PM from Michigan Union.",
        timestamp: "Nov 22, 10:43 AM"
      },
      {
        id: "msg_2",
        senderId: "usr_002",
        senderName: "Alex J.",
        senderRole: "rider",
        content: "Sounds perfect, I will be waiting by the front steps with my backpack.",
        timestamp: "Nov 22, 10:45 AM"
      }
    ],
    timeline: [
      {
        id: "tl_1",
        timestamp: "Nov 22, 10:30 AM",
        title: "Group Created",
        description: "Sarah K. initiated public group for flight DL 1422.",
        eventType: "group_created"
      },
      {
        id: "tl_2",
        timestamp: "Nov 22, 10:42 AM",
        title: "Rider Joined",
        description: "Alex J. joined group (Flight within 90m window).",
        eventType: "group_joined"
      }
    ],
    createdAt: "2026-11-22T10:30:00Z"
  },
  {
    id: "#G-027",
    tripId: "#T-0041",
    type: "Public",
    riders: [
      {
        userId: "usr_003",
        name: "Mike T.",
        email: "mt@umich.edu",
        paymentHandle: "@mike_venmo",
        isBooker: true,
        paymentStatus: "confirmed",
        shareAmount: 16.53,
        joinedAt: "2026-11-21T18:15:00Z"
      },
      {
        userId: "usr_006",
        name: "Chloe M.",
        email: "cm@umich.edu",
        paymentHandle: "@chloe_m",
        isBooker: false,
        paymentStatus: "requested",
        shareAmount: 22.73,
        joinedAt: "2026-11-21T19:00:00Z"
      },
      {
        userId: "usr_007",
        name: "David Z.",
        email: "dz@umich.edu",
        paymentHandle: "@david_zelle",
        isBooker: false,
        paymentStatus: "requested",
        shareAmount: 22.74,
        joinedAt: "2026-11-21T19:30:00Z"
      }
    ],
    ridersSummary: "Mike T., +2",
    bookerId: "usr_003",
    bookerName: "Mike T.",
    vehicleSuggestion: "UberXL",
    fare: 62,
    fareType: "estimated",
    status: "Ready",
    bookingStatus: "Booking Pending",
    capacity: "3/4",
    maxCapacity: 4,
    chatMessages: [
      {
        id: "msg_3",
        senderId: "usr_003",
        senderName: "Mike T.",
        senderRole: "booker",
        content: "I will book the UberXL as soon as we lock in at Pierpont Commons.",
        timestamp: "Nov 21, 7:45 PM"
      }
    ],
    timeline: [
      {
        id: "tl_3",
        timestamp: "Nov 21, 6:15 PM",
        title: "Group Formed",
        description: "Mike T. designated as booker for North Campus pickup.",
        eventType: "group_created"
      }
    ],
    createdAt: "2026-11-21T18:15:00Z"
  },
  {
    id: "#G-025",
    tripId: "#T-0038",
    type: "Private",
    riders: [
      {
        userId: "usr_004",
        name: "Priya R.",
        email: "pr@umich.edu",
        paymentHandle: "@priya_v",
        isBooker: true,
        paymentStatus: "confirmed",
        shareAmount: 21.6,
        joinedAt: "2026-10-18T12:00:00Z"
      },
      {
        userId: "usr_001",
        name: "Sarah K.",
        email: "sk@umich.edu",
        paymentHandle: "@sarah_venmo",
        isBooker: false,
        paymentStatus: "confirmed",
        shareAmount: 26.4,
        joinedAt: "2026-10-18T12:30:00Z"
      }
    ],
    ridersSummary: "Priya R., +1",
    bookerId: "usr_004",
    bookerName: "Priya R.",
    vehicleSuggestion: "UberX",
    fare: 48,
    fareType: "actual",
    status: "Completed",
    bookingStatus: "Booked",
    capacity: "2/4",
    maxCapacity: 4,
    chatMessages: [
      {
        id: "msg_4",
        senderId: "usr_004",
        senderName: "Priya R.",
        senderRole: "booker",
        content: "Final receipt was $48.00 on Lyft. Payment link sent!",
        timestamp: "Oct 19, 3:45 PM"
      }
    ],
    timeline: [
      {
        id: "tl_4",
        timestamp: "Oct 19, 3:50 PM",
        title: "Ride Completed",
        description: "All 2 riders dropped off at DTW. Payments confirmed.",
        eventType: "ride_completed"
      }
    ],
    createdAt: "2026-10-18T12:00:00Z"
  }
];
const INITIAL_EVENT_LOGS = [
  {
    id: "evt_001",
    timestamp: "Nov 22, 10:42 AM",
    eventType: "group_joined",
    user: "Alex J.",
    userId: "usr_002",
    tripId: "#T-0042",
    groupId: "#G-028",
    details: "Joined group #G-028 (Trip #T-0042)",
    source: "mobile_app",
    metadata: { route: "UMich \u2192 DTW", flightTime: "5:15 PM" }
  },
  {
    id: "evt_002",
    timestamp: "Nov 22, 10:30 AM",
    eventType: "trip_created",
    user: "Sarah K.",
    userId: "usr_001",
    tripId: "#T-0042",
    details: "UMich \u2192 DTW \xB7 Nov 24 \xB7 Flight 5:15 PM",
    source: "mobile_app",
    metadata: { airline: "Delta", flight: "DL 1422" }
  },
  {
    id: "evt_003",
    timestamp: "Nov 21, 4:15 PM",
    eventType: "payment_sent",
    user: "Mike T.",
    userId: "usr_003",
    groupId: "#G-025",
    details: "$19.95 to Sarah K. (Group #G-025)",
    source: "mobile_app",
    metadata: { method: "Venmo", amount: 19.95, recipient: "Sarah K." }
  },
  {
    id: "evt_004",
    timestamp: "Nov 21, 3:50 PM",
    eventType: "ride_completed",
    user: "System",
    tripId: "#T-0035",
    groupId: "#G-025",
    details: "Group #G-025 completed \xB7 3 riders",
    source: "system",
    metadata: { finalFare: 48, dropoff: "DTW North Terminal" }
  },
  {
    id: "evt_005",
    timestamp: "Nov 21, 2:10 PM",
    eventType: "user_flaked",
    user: "Dave L.",
    userId: "usr_005",
    groupId: "#G-024",
    details: "No-show for Group #G-024",
    source: "mobile_app",
    metadata: { penaltyApplied: true, accountFlagged: true }
  },
  {
    id: "evt_006",
    timestamp: "Nov 20, 8:00 AM",
    eventType: "rating_submitted",
    user: "Sarah K.",
    userId: "usr_001",
    details: "Rated Alex J.: Reliability 5, Punctuality 4",
    source: "mobile_app",
    metadata: { targetUser: "Alex J.", reliability: 5, punctuality: 4 }
  },
  {
    id: "evt_007",
    timestamp: "Nov 19, 1:15 PM",
    eventType: "booker_reassigned",
    user: "Mike T.",
    userId: "usr_003",
    groupId: "#G-027",
    details: "Accepted Booker role after Sarah K. transferred booking",
    source: "mobile_app",
    metadata: { discountApplied: "30%" }
  },
  {
    id: "evt_008",
    timestamp: "Nov 18, 5:40 PM",
    eventType: "fare_confirmed",
    user: "Sarah K.",
    userId: "usr_001",
    groupId: "#G-025",
    details: "Actual fare confirmed at $48.00 (split among 3 riders)",
    source: "mobile_app",
    metadata: { estimatedFare: 52, actualFare: 48 }
  }
];
const INITIAL_SCHOOLS = [
  {
    id: "sch_umich",
    name: "University of Michigan",
    shortName: "UMich",
    domain: "umich.edu",
    usersCount: 247,
    ridesCount: 42,
    destinations: ["DTW"],
    status: "Live",
    soloFareEstimate: 65,
    airportBufferMinutes: 150,
    address: "500 S State St, Ann Arbor, MI 48109",
    notes: "Active campus pilot with student union & north campus presets"
  },
  {
    id: "sch_msu",
    name: "Michigan State University",
    shortName: "MSU",
    domain: "msu.edu",
    usersCount: 0,
    ridesCount: 0,
    destinations: ["LAN"],
    status: "Draft",
    soloFareEstimate: 45,
    airportBufferMinutes: 120,
    address: "220 Trowbridge Rd, East Lansing, MI 48824",
    notes: "Configured for Spring expansion pilot"
  }
];
const INITIAL_DESTINATIONS = [
  {
    id: "dst_dtw",
    schoolId: "sch_umich",
    schoolName: "UMich",
    name: "Detroit Metro Airport",
    code: "DTW",
    terminals: ["McNamara", "North"],
    directions: "both",
    status: "Active"
  },
  {
    id: "dst_lan",
    schoolId: "sch_msu",
    schoolName: "MSU",
    name: "Capital Region International Airport",
    code: "LAN",
    terminals: ["Main Terminal"],
    directions: "both",
    status: "Active"
  }
];
const INITIAL_PICKUP_LOCATIONS = [
  {
    id: "pic_001",
    schoolId: "sch_umich",
    schoolName: "UMich",
    name: "Michigan Union",
    area: "Campus",
    address: "530 S State St",
    status: "Active",
    notes: "Primary central campus meeting point near front loop"
  },
  {
    id: "pic_002",
    schoolId: "sch_umich",
    schoolName: "UMich",
    name: "Pierpont Commons",
    area: "North",
    address: "2101 Bonisteel Blvd",
    status: "Active",
    notes: "North campus engineering & music student meeting point"
  },
  {
    id: "pic_003",
    schoolId: "sch_umich",
    schoolName: "UMich",
    name: "Central Off-Campus",
    area: "Off-campus",
    address: "Near S Division & E William",
    status: "Active",
    notes: "South Quad / residential student coordination point"
  }
];
const INITIAL_BREAK_DATES = [
  {
    id: "brk_001",
    schoolId: "sch_umich",
    schoolName: "UMich",
    event: "Fall Study Break",
    start: "Oct 19",
    end: "Oct 20",
    demand: "Medium",
    notifSent: "\u2713 Oct 5, Oct 16",
    notification14dSent: true,
    notification3dSent: true,
    tripsCount: 18
  },
  {
    id: "brk_002",
    schoolId: "sch_umich",
    schoolName: "UMich",
    event: "Thanksgiving Recess",
    start: "Nov 25",
    end: "Nov 27",
    demand: "Very High",
    notifSent: "\u2713 Nov 11, \u23F3 Nov 22",
    notification14dSent: true,
    notification3dSent: false,
    tripsCount: 89
  },
  {
    id: "brk_003",
    schoolId: "sch_umich",
    schoolName: "UMich",
    event: "Winter Break / Exams",
    start: "Dec 11",
    end: "Dec 21",
    demand: "Very High",
    notifSent: "Scheduled: Nov 27, Dec 8",
    notification14dSent: false,
    notification3dSent: false,
    tripsCount: 140
  }
];
const INITIAL_NOTIFICATIONS = [
  {
    id: "ntf_001",
    date: "Nov 11, 2024",
    title: "Thanksgiving is 2 weeks away!",
    message: "47 students are looking for rides on Nov 24. Post your trip now and save 60% vs. riding solo.",
    audience: "All registered students",
    target: "UMich \xB7 All (247)",
    opened: "68% \xB7 168 opens",
    tripsCreated: "23 trips",
    deliveredCount: 247,
    totalAudience: 247,
    deliveryRate: "100%",
    status: "Sent"
  },
  {
    id: "ntf_002",
    date: "Oct 14, 2024",
    title: "Fall break rides are open",
    message: "Coordinate your DTW airport rides early for fall break. Match with verified UMich students.",
    audience: "All registered students",
    target: "UMich \xB7 All (212)",
    opened: "54% \xB7 114 opens",
    tripsCreated: "14 trips",
    deliveredCount: 212,
    totalAudience: 212,
    deliveryRate: "100%",
    status: "Sent"
  },
  {
    id: "ntf_003",
    date: "Oct 3, 2024",
    title: "Plan your fall break ride",
    message: "Match with students on your exact flight schedule to Detroit Metro Airport.",
    audience: "All registered students",
    target: "UMich \xB7 All (198)",
    opened: "61% \xB7 121 opens",
    tripsCreated: "18 trips",
    deliveredCount: 198,
    totalAudience: 198,
    deliveryRate: "100%",
    status: "Sent"
  }
];
const INITIAL_DASHBOARD_STATS = {
  totalUsers: 247,
  totalUsersChange: "\u2191 34 this week",
  activeTrips: 89,
  activeTripsChange: "\u2191 12 today",
  completedRides: 42,
  completedRidesChange: "\u2191 8 this week",
  matchToCompleteRate: "68%",
  matchToCompleteChange: "\u2191 5% vs last week",
  avgRidersPerGroup: 2.8,
  avgSavingsPerRider: 32,
  paymentConfirmedRate: "91%",
  avgReliability: 4.6,
  ridesPerDay: [
    { date: "Nov 1", rides: 12, completed: 8 },
    { date: "Nov 5", rides: 18, completed: 14 },
    { date: "Nov 10", rides: 25, completed: 19 },
    { date: "Nov 15", rides: 38, completed: 28 },
    { date: "Nov 20", rides: 62, completed: 34 },
    { date: "Nov 22", rides: 89, completed: 42 }
  ],
  directionSplit: [
    { name: "UMich \u2192 DTW", count: 58, percentage: 65 },
    { name: "DTW \u2192 UMich", count: 31, percentage: 35 }
  ],
  demandByBreak: [
    { breakName: "Fall Study Break", count: 18, demandLevel: "Medium" },
    { breakName: "Thanksgiving Recess", count: 89, demandLevel: "Very High" },
    { breakName: "Winter Break", count: 140, demandLevel: "Very High" },
    { breakName: "Spring Break", count: 45, demandLevel: "High" }
  ]
};
export {
  INITIAL_BREAK_DATES,
  INITIAL_DASHBOARD_STATS,
  INITIAL_DESTINATIONS,
  INITIAL_EVENT_LOGS,
  INITIAL_GROUPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PICKUP_LOCATIONS,
  INITIAL_SCHOOLS,
  INITIAL_SETTINGS,
  INITIAL_TRIPS,
  INITIAL_USERS,
  WIREFRAME_ANNOTATIONS,
  WIREFRAME_SCREENS
};
