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

      // Collect users who reacted with <:LOTSYes:1519638064945954908>
      const reaction = message.reactions.cache.get('1519638064945954908');
      const reactedMembers = [];

      // Always include the person who ran /postflight (dispatcher)
      if (allocation.dispatcherId) {
        const dispatcherMember = await channel.guild.members.fetch(allocation.dispatcherId).catch(() => null);
        if (dispatcherMember) reactedMembers.push(dispatcherMember);
      }

      if (reaction) {
        const users = await reaction.users.fetch();
        const nonBotUsers = users.filter(u => !u.bot && u.id !== allocation.dispatcherId);

        for (const [userId] of nonBotUsers) {
          try {
            const member = await channel.guild.members.fetch(userId);
            if (member) reactedMembers.push(member);
          } catch (err) {
            console.warn(`Could not fetch guild member profile for ${userId}:`, err.message);
          }
        }
      }

      // Generate briefing release message
      const briefingContent = buildBriefingReleaseEmbed(flight, reactedMembers);
      const userPings = reactedMembers.map(m => `<@${m.id}>`).join(' ');

      // Send 1h briefing release message in channel
      await channel.send({
        content: `📢 **1-HOUR FLIGHT BRIEFING RELEASE** ${userPings}\n\n${briefingContent}`
      });

      console.log(`✅ Released briefing for flight ${flight.number} with ${reactedMembers.length} allocated members.`);
    } catch (err) {
      console.error('Error executing scheduled briefing release:', err);
    }
  }, delay);
}

module.exports = { scheduleReminders, parseStaffTime };