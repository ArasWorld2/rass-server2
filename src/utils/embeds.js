const { EmbedBuilder } = require('discord.js');

const EMBED_COLOR = '#002370';

const ROLES = [
  { key: 'dispatchSupervisor',  label: 'Flight Dispatcher',     emoji: '<:WP_person:1503497022211227850>', max: 1 },
  { key: 'flightSupervisor',    label: 'Flight Supervisor',      emoji: '<:WP_person:1503497022211227850>', max: 2 },
  { key: 'captain',             label: 'Captain',                emoji: '<:WP_man:1503497042071257249>',    max: 1 },
  { key: 'firstOfficer',        label: 'First Officer',          emoji: '<:WP_link:1503497040406253769>',   max: 1 },
  { key: 'purser',              label: 'Senior Cabin Attendant', emoji: '<:WP_telephone:1503497077588496614>', max: 1 },
  { key: 'cabinCrew',           label: 'Cabin Crew',             emoji: '<:WP_people:1503497020311343234>', max: 4 },
  { key: 'groundHandling',      label: 'Turnaround Manager',     emoji: '<:WP_helpdesk:1503497171243110440>', max: 1 },
  { key: 'tarmacSupervisor',    label: 'Ground Crew',            emoji: '<:WP_passenger:1503497017295376514>', max: 3 },
  { key: 'dispatchCoordinator', label: 'Customer Service',       emoji: '<:WP_share:1503497105908437032>',  max: 3 },
  { key: 'bagDropAgent',        label: 'Bag Drop Agent',         emoji: '<:WP_share:1503497105908437032>', max: 3 },
  { key: 'gateAgent',           label: 'Gate Agent',             emoji: '<:WP_helpdesk:1503497171243110440>', max: 1 },
  { key: 'loungeAttendant',     label: 'Lounge Attendant',       emoji: '<:WP_link:197040406253769>', max: 2 },
];

const FLIGHT_ROLE_KEYS = ['dispatchSupervisor', 'flightSupervisor', 'captain', 'firstOfficer', 'purser', 'cabinCrew', 'groundHandling', 'tarmacSupervisor'];
const GROUND_ROLE_KEYS = ['dispatchCoordinator', 'bagDropAgent', 'gateAgent', 'loungeAttendant'];

/**
 * Builds initial flight schedule embed posted by /postflight
 */
function buildMainEmbed(flight) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';
  const route = `**Route:** ${flight.from || 'Departure'} ➔ ${flight.to || 'Destination'}`;
  const plane = `**Aircraft:** ${flight.aircraft || 'Boeing XXX'}, ${flight.registration || 'SP-XXX'}`;
  
  let formattedTime = flight.date || flight.staffTime || 'Hammertime';
  if (flight.timestamp && !isNaN(flight.timestamp)) {
    const timeInSeconds = Math.floor(parseInt(flight.timestamp, 10) / (flight.timestamp > 1e11 ? 1000 : 1));
    formattedTime = `<t:${timeInSeconds}:F>`;
  }

  const descriptionText = 
    `### Flight Schedule\n\n` +
    `▶ ${route}\n` +
    `▶ ${plane}\n` +
    `▶ **Date & Time:** ${formattedTime}\n\n` +
    `> **If you wish to allocate yourself to this departure, please click the 👍 reaction below.** By reacting, you are confirming that you will be available for the selected time slot and are committed to attending the session. Please ensure you are able to participate before allocating yourself, as your reaction will be considered a confirmation of your availability.`;

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(`🛫 ${flightNumber}`)
    .setDescription(descriptionText);
}

/**
 * Builds the 1-Hour Briefing Release embed containing roles populated with reacted users
 */
function buildBriefingReleaseEmbed(flight, userIds = []) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';
  
  let userIndex = 0;
  
  const formatRoleSection = (keys) => {
    return keys.map(key => {
      const role = ROLES.find(r => r.key === key);
      if (!role) return '';

      const assignedUsers = [];
      while (userIndex < userIds.length && assignedUsers.length < role.max) {
        assignedUsers.push(`<@${userIds[userIndex]}>`);
        userIndex++;
      }

      const count = `(${assignedUsers.length}/${role.max})`;
      const members = assignedUsers.length > 0 ? ' ' + assignedUsers.join(', ') : '';
      return `${role.emoji} **${role.label}** ${count}${members}`;
    }).filter(Boolean).join('\n');
  };

  const flightRoleLines = formatRoleSection(FLIGHT_ROLE_KEYS);
  const groundRoleLines = formatRoleSection(GROUND_ROLE_KEYS);

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(`📢 Flight Briefing Release — ${flightNumber}`)
    .setDescription(`Briefing details for flight **${flightNumber}** (${flight.from} ➔ ${flight.to}). Below is the final role roster for allocated personnel.`)
    .addFields([
      { name: 'Flight Roles', value: flightRoleLines || 'None', inline: false },
      { name: 'Ground Roles', value: groundRoleLines || 'None', inline: false },
    ])
    .setTimestamp();
}

module.exports = { 
  ROLES, 
  buildMainEmbed, 
  buildBriefingReleaseEmbed 
};