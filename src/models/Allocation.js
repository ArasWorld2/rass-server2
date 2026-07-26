const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  dispatcherId: { type: String }, // Stores the user ID who ran /postflight
  flight: {
    number: String,
    from: String,
    to: String,
    staffTime: String,
    staffTimeUtc: String,
    passengerTime: String,
    aircraft: String,
    registration: String, // Added registration
    date: String,
    timestamp: String,
    gate: { type: String, default: 'TBA' },
    depRunway: { type: String, default: 'TBA' }, // Added departure runway
    arrRunway: { type: String, default: 'TBA' }, // Added arrival runway
    boardingTime: String,
    operationsClosure: String,
  },
  dispatchSupervisor:  { type: [String], default: [] },
  flightSupervisor:    { type: [String], default: [] },
  captain:             { type: [String], default: [] },
  firstOfficer:        { type: [String], default: [] },
  purser:              { type: [String], default: [] },
  cabinCrew:           { type: [String], default: [] },
  groundHandling:      { type: [String], default: [] },
  tarmacSupervisor:    { type: [String], default: [] },
  dispatchCoordinator: { type: [String], default: [] },
  bagDropAgent:        { type: [String], default: [] },
  gateAgent:           { type: [String], default: [] },
  loungeAttendant:     { type: [String], default: [] },
  queues: {
    dispatchSupervisor:  { type: [String], default: [] },
    flightSupervisor:    { type: [String], default: [] },
    captain:             { type: [String], default: [] },
    firstOfficer:        { type: [String], default: [] },
    purser:              { type: [String], default: [] },
    cabinCrew:           { type: [String], default: [] },
    groundHandling:      { type: [String], default: [] },
    tarmacSupervisor:    { type: [String], default: [] },
    dispatchCoordinator: { type: [String], default: [] },
    bagDropAgent:        { type: [String], default: [] },
    gateAgent:           { type: [String], default: [] },
    loungeAttendant:     { type: [String], default: [] },
  },
}, { timestamps: true });

module.exports = mongoose.model('Allocation', allocationSchema);