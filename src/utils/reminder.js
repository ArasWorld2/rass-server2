const { buildBriefingReleaseEmbed } = require('./embeds');

function parseStaffTime(staffTime) {
  try {
    if (!staffTime) return null;
    if (!isNaN(staffTime)) {
      const ts = parseInt(staffTime, 10);
      return new Date(ts > 1e11 ? ts : ts * 1000);
    }
    const cleaned = staffTime.replace(/(\d+)(st|nd|rd|th)/, '$1');
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) return date;
  } catch (e) {
    console.error('Failed to parse flight date:', e);
  }
  return null;
}

async function scheduleReminders(client, allocation, minutesBefore = 60) {
  const flight = allocation.flight || {};
  const timeStr = flight.date || flight.timestamp;
  const staffDate = parseStaffTime(timeStr);

  if (!staffDate) {
    console.warn(`Could not parse departure time for ${flight.number}: "${timeStr}"`);
    return;
  }

  const reminderTime = new Date(staffDate.getTime() - minutesBefore * 60 * 1000);
  const delay = reminderTime.getTime() - Date.now();

  if (delay <= 0) return;

  console.log(`⏰ Briefing release scheduled for flight ${flight.number} in ${Math.round(delay / 60000)} minutes.`);

  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(allocation.channelId).catch(() => null);
      if (!channel) return;

      const message = await channel.messages.fetch(allocation.messageId).catch(() => null);
      if (!message) return;

      // Collect all users who reacted with 👍
      const reaction = message.reactions.cache.get('👍');
      const userIds = [];

      if (reaction) {
        const users = await reaction.users.fetch();
        users.filter(u => !u.bot).forEach(u => userIds.push(u.id));
      }

      // Generate the briefing embed containing role roster
      const briefingEmbed = buildBriefingReleaseEmbed(flight, userIds);
      const userPings = userIds.map(id => `<@${id}>`).join(' ');

      // Post the briefing release in the channel
      await channel.send({
        content: `📢 **1-HOUR FLIGHT BRIEFING RELEASE** ${userPings}`,
        embeds: [briefingEmbed]
      });

      console.log(`✅ Released briefing for flight ${flight.number} with ${userIds.length} allocated users.`);
    } catch (err) {
      console.error('Error executing scheduled briefing release:', err);
    }
  }, delay);
}

module.exports = { scheduleReminders, parseStaffTime };