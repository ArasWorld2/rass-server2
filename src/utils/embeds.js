const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

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

function getRoleConfig(key) {
  return ROLES.find(r => r.key === key);
}

function buildRoleLines(keys, allocation) {
  return keys.map(key => {
    const role = ROLES.find(r => r.key === key);
    if (!role) return '';
    const filled = (allocation && allocation[role.key]) || [];
    const count = `(${filled.length}/${role.max})`;
    const members = filled.length > 0 ? ' ' + filled.map(id => `<@${id}>`).join(', ') : '';
    return `${role.emoji} **${role.label}** ${count}${members}`;
  }).filter(Boolean).join('\n');
}

function buildMainEmbed(flight, allocation) {
  const flightNumber = flight.number || flight.flightNumber || 'LOXXXX';
  const route = `**Route:** ${flight.from || 'Departure'} ➔ ${flight.to || 'Destination'}`;
  const plane = `**Aircraft:** ${flight.aircraft || 'Boeing XXX'}, ${flight.registration || 'SP-XXX'}`;
  
  // Format time as Hammertime if a timestamp/date object is provided
  let formattedTime = flight.date || flight.staffTime || 'Hammertime';
  if (flight.timestamp) {
    const timeInSeconds = Math.floor(new Date(flight.timestamp).getTime() / 1000);
    formattedTime = `<t:${timeInSeconds}:F>`;
  } else if (!isNaN(Date.parse(flight.date))) {
    const timeInSeconds = Math.floor(new Date(flight.date).getTime() / 1000);
    formattedTime = `<t:${timeInSeconds}:F>`;
  }
  
  const dateTime = `**Date & Time:** ${formattedTime}`;

  const descriptionText = 
    `### Flight Schedule\n\n` +
    `▶ ${route}\n` +
    `▶ ${plane}\n` +
    `▶ ${dateTime}\n\n` +
    `> **If you wish to allocate yourself to this departure, please click the 👍 reaction below.** By reacting, you are confirming that you will be available for the selected time slot and are committed to attending the session. Please ensure you are able to participate before allocating yourself, as your reaction will be considered a confirmation of your availability.`;

  const flightRoleLines = buildRoleLines(FLIGHT_ROLE_KEYS, allocation);
  const groundRoleLines = buildRoleLines(GROUND_ROLE_KEYS, allocation);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(`🛫 ${flightNumber}`)
    .setDescription(descriptionText);

  // If role allocations are present, add them as fields below
  if (flightRoleLines || groundRoleLines) {
    embed.addFields([
      { name: 'Flight Roles', value: flightRoleLines || 'None', inline: false },
      { name: 'Ground Roles', value: groundRoleLines || 'None', inline: false },
    ]);
  }

  return embed;
}

function buildDropdown() {
  const options = ROLES.map(role =>
    new StringSelectMenuOptionBuilder()
      .setLabel(role.label)
      .setValue(`join_${role.key}`)
      .setDescription(`Join or leave ${role.label} (max ${role.max})`)
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId('role_select')
    .setPlaceholder('Select a role to allocate or unallocate yourself')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

function buildButtons() {
  return [buildDropdown()];
}

module.exports = { 
  ROLES, 
  getRoleConfig, 
  buildFlightEmbed: buildMainEmbed, 
  buildAllocationEmbed: buildMainEmbed, 
  buildMainEmbed, 
  buildButtons, 
  buildDropdown 
};