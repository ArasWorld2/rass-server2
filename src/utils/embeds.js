// Mapping internal keys to role details & Discord Role IDs
const ROLES = [
  { key: 'dispatchSupervisor',  label: 'Flight Dispatcher',     discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_person:1503497022211227850>', max: 1 },
  { key: 'flightSupervisor',    label: 'Flight Supervisor',      discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_person:1503497022211227850>', max: 2 },
  { key: 'captain',             label: 'Captain',                discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_man:1503497042071257249>',    max: 1 },
  { key: 'firstOfficer',        label: 'First Officer',          discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_link:1503497040406253769>',   max: 1 },
  { key: 'purser',              label: 'Senior Cabin Attendant', discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_telephone:1503497077588496614>', max: 1 },
  { key: 'cabinCrew',           label: 'Cabin Crew',             discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_people:1503497020311343234>', max: 4 },
  { key: 'groundHandling',      label: 'Turnaround Manager',     discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_helpdesk:1503497171243110440>', max: 1 },
  { key: 'tarmacSupervisor',    label: 'Ground Crew',            discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_passenger:1503497017295376514>', max: 3 },
  { key: 'dispatchCoordinator', label: 'Customer Service',       discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_share:1503497105908437032>',  max: 3 },
  { key: 'bagDropAgent',        label: 'Bag Drop Agent',         discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_share:1503497105908437032>', max: 3 },
  { key: 'gateAgent',           label: 'Gate Agent',             discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_helpdesk:1503497171243110440>', max: 1 },
  { key: 'loungeAttendant',     label: 'Lounge Attendant',       discordRoleId: 'ROLE_ID_HERE', emoji: '<:WP_link:197040406253769>', max: 2 },
];

const FLIGHT_ROLE_KEYS = ['dispatchSupervisor', 'flightSupervisor', 'captain', 'firstOfficer', 'purser', 'cabinCrew', 'groundHandling', 'tarmacSupervisor'];
const GROUND_ROLE_KEYS = ['dispatchCoordinator', 'bagDropAgent', 'gateAgent', 'loungeAttendant'];

/**
 * Builds initial plain-text flight schedule message (NO embed card)
 */
function buildMainEmbed(flight) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';
  const from = flight.from || 'Departure';
  const to = flight.to || 'Destination';
  const aircraft = flight.aircraft || 'Boeing XXX';
  const reg = flight.registration || 'SP-XXX';

  let formattedTime = flight.date || flight.staffTime || 'Hammertime';
  if (flight.timestamp && !isNaN(flight.timestamp)) {
    const timeInSeconds = Math.floor(parseInt(flight.timestamp, 10) / (flight.timestamp > 1e11 ? 1000 : 1));
    formattedTime = `<t:${timeInSeconds}:F>`;
  }

  return (
    `# <:LOTTail:1243912109125795920> ${flightNumber}\n` +
    `-# Flight Schedule\n\n` +
    `<:LOTSArrow:1519637984952061972> **Route:** ${from} → ${to}\n` +
    `<:LOTSArrow:1519637984952061972> **Aircraft:** ${aircraft}, ${reg}\n` +
    `<:LOTSArrow:1519637984952061972> **Date & Time:** ${formattedTime}\n\n` +
    `> **__If you wish to allocate yourself to this departure, please click the <:LOTSYes:1519638064945954908> reaction below__**. By reacting, you are confirming that you will be available for the selected time slot and are committed to attending the session. Please ensure you are able to participate before allocating yourself, as your reaction will be considered a __confirmation of your availability.__`
  );
}

/**
 * Builds the 1-Hour Briefing Release text message matching members by Role IDs
 */
function buildBriefingReleaseEmbed(flight, members = []) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';

  const formatRoleSection = (keys) => {
    return keys.map(key => {
      const roleConfig = ROLES.find(r => r.key === key);
      if (!roleConfig) return '';

      // Check if member has the exact Role ID
      const matchingMembers = members.filter(member => 
        member.roles.cache.has(roleConfig.discordRoleId)
      ).slice(0, roleConfig.max);

      const assignedUserPings = matchingMembers.map(m => `<@${m.id}>`);
      const count = `(${assignedUserPings.length}/${roleConfig.max})`;
      const membersStr = assignedUserPings.length > 0 ? ' ' + assignedUserPings.join(', ') : '';

      return `${roleConfig.emoji} **${roleConfig.label}** ${count}${membersStr}`;
    }).filter(Boolean).join('\n');
  };

  const flightRoleLines = formatRoleSection(FLIGHT_ROLE_KEYS);
  const groundRoleLines = formatRoleSection(GROUND_ROLE_KEYS);

  return (
    `# 📢 Flight Briefing Release — ${flightNumber}\n` +
    `Briefing details for flight **${flightNumber}** (${flight.from} → ${flight.to}). Below is the final role roster for allocated personnel:\n\n` +
    `### Flight Roles\n${flightRoleLines || 'None'}\n\n` +
    `### Ground Roles\n${groundRoleLines || 'None'}`
  );
}

module.exports = { 
  ROLES, 
  buildMainEmbed, 
  buildBriefingReleaseEmbed 
};