// Mapping internal keys to role details, priority order, & Discord Role IDs
const ROLES = [
  { key: 'captain',          label: 'Captain',               discordRoleId: 'ROLE_ID_HERE', priority: 1, emoji: '<:LOTSArrow:1519637984952061972>', max: 1 },
  { key: 'firstOfficer',     label: 'First Officer',         discordRoleId: 'ROLE_ID_HERE', priority: 2, emoji: '<:LOTSArrow:1519637984952061972>', max: 1 },
  { key: 'purser',           label: 'Purser',                discordRoleId: '1522601815965700277', priority: 3, emoji: '<:LOTSArrow:1519637984952061972>', max: 1 },
  { key: 'cabinCrew',        label: 'Cabin Crew',            discordRoleId: '1522601469042495569', priority: 4, emoji: '<:LOTSArrow:1519637984952061972>', max: 4 },
  { key: 'groundHandling',   label: 'Ramp Supervisor',       discordRoleId: '1283477756763443291', priority: 5, emoji: '<:LOTSArrow:1519637984952061972>', max: 1 },
  { key: 'tarmacSupervisor', label: 'Ramp Agents',           discordRoleId: '1522602272440451255', priority: 6, emoji: '<:LOTSArrow:1519637984952061972>', max: 3 },
  { key: 'gateAgent',        label: 'Gate Agent',            discordRoleId: 'ROLE_ID_HERE', priority: 7, emoji: '<:LOTSArrow:1519637984952061972>', max: 1 },
];

/**
 * Builds initial plain-text flight schedule message
 */
function buildMainEmbed(flight) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';
  const from = flight.from || 'Departure';
  const to = flight.to || 'Destination';
  const aircraft = flight.aircraft || 'Boeing XXX';
  const reg = flight.registration || 'SP-XXX';

  let formattedTime = flight.date || flight.staffTime || 'Hammertime';

  if (/^\d+$/.test(formattedTime)) {
    const timeInSeconds = Math.floor(parseInt(formattedTime, 10) / (formattedTime.length > 11 ? 1000 : 1));
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
 * Builds the 1-Hour Briefing Release text message
 */
function buildBriefingReleaseEmbed(flight, members = [], dispatcherId = null) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';
  const from = flight.from || 'DEST';
  const to = flight.to || 'ARRIVAL';
  const aircraft = `${flight.aircraft || 'Boeing XXX'}, ${flight.registration || 'SP-XXX'}`;

  let formattedTime = flight.date || flight.timestamp || 'TBA';
  if (/^\d+$/.test(formattedTime)) {
    const timeInSeconds = Math.floor(parseInt(formattedTime, 10) / (formattedTime.length > 11 ? 1000 : 1));
    formattedTime = `<t:${timeInSeconds}:F>`;
  }

  // 1. Sort roles by priority
  const sortedRoles = [...ROLES].sort((a, b) => a.priority - b.priority);

  // 2. Track assignments
  const assignments = {};
  ROLES.forEach(r => assignments[r.key] = []);
  const assignedUserIds = new Set();

  // 3. Process each role in priority order
  for (const roleConfig of sortedRoles) {
    if (!roleConfig.discordRoleId || roleConfig.discordRoleId === 'ROLE_ID_HERE') continue;

    for (const member of members) {
      if (assignments[roleConfig.key].length >= roleConfig.max) break;
      if (assignedUserIds.has(member.id)) continue;

      if (member.roles && member.roles.cache.has(roleConfig.discordRoleId)) {
        assignments[roleConfig.key].push(member.id);
        assignedUserIds.add(member.id);
      }
    }
  }

  const getRoleText = (key) => {
    const ids = assignments[key] || [];
    return ids.length > 0 ? ids.map(id => `<@${id}>`).join(', ') : '';
  };

  const dispatcherMention = dispatcherId ? `<@${dispatcherId}>` : (flight.dispatcherId ? `<@${flight.dispatcherId}>` : '');

  return (
    `## <:LOTTail:1243912109125795920> ${flightNumber}\n` +
    `-# Flight Briefing\n\n` +
    `**Route:** ${from} --> ${to}\n` +
    `**Aircraft:** ${aircraft}\n` +
    `**Date & Time:** ${formattedTime}\n` +
    `**Flight Dispatcher:** ${dispatcherMention}\n` +
    `**Gate & Stand:** ${flight.gate || 'TBA'}\n` +
    `**Departure Runway:** ${flight.depRunway || 'TBA'}\n` +
    `**Arrival Runway:** ${flight.arrRunway || 'TBA'}\n\n` +
    `**Flight Crew**\n` +
    `<:LOTSArrow:1519637984952061972> **Captain:** ${getRoleText('captain')}\n` +
    `<:LOTSArrow:1519637984952061972> **First Officer:** ${getRoleText('firstOfficer')}\n\n` +
    `<:LOTSArrow:1519637984952061972> **Purser:** ${getRoleText('purser')}\n` +
    `<:LOTSArrow:1519637984952061972> **Cabin Crew:** ${getRoleText('cabinCrew')}\n\n` +
    `**On-Ground Crew**\n` +
    `<:LOTSArrow:1519637984952061972> **Ramp Supervisor:** ${getRoleText('groundHandling')}\n` +
    `<:LOTSArrow:1519637984952061972> **Ramp Agents:** ${getRoleText('tarmacSupervisor')}\n\n` +
    `<:LOTSArrow:1519637984952061972> **Priority Bag Drop:** *Purser*\n` +
    `<:LOTSArrow:1519637984952061972> **Non-Priority:** *Cabin crew*\n` +
    `<:LOTSArrow:1519637984952061972> **Gate Agent:** ${getRoleText('gateAgent')}`
  );
}

module.exports = { 
  ROLES, 
  buildMainEmbed, 
  buildBriefingReleaseEmbed 
};