const { EmbedBuilder } = require('discord.js');

/**
 * Parses a date string or timestamp into a Date object.
 */
function parseStaffTime(staffTime) {
  try {
    if (!staffTime) return null;

    // Handle standard Unix timestamp string/number (seconds or milliseconds)
    if (!isNaN(staffTime)) {
      const ts = parseInt(staffTime, 10);
      return new Date(ts > 1e11 ? ts : ts * 1000);
    }

    const cleaned = staffTime.replace(/(\d+)(st|nd|rd|th)/, '$1');
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) return date;

    // Manual parse fallback: "Saturday, 9 May 2026 12:15"
    const match = staffTime.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\d{1,2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return new Date(`${month} ${day}, ${year} ${hour}:${minute}:00`);
    }
  } catch (e) {
    console.error('Failed to parse staff time:', e);
  }
  return null;
}

function buildReminderEmbed(flight) {
  return new EmbedBuilder()
    .setTitle('🛫 Flight Briefing Release')
    .setDescription(
      `Your flight **${flight.number}** (${flight.from} ➔ ${flight.to}) is scheduled to depart in **1 hour**!\n\n` +
      `Please ensure all flight and ground preparation steps are finalized.`
    )
    .addFields([
      { name: 'Aircraft', value: `${flight.aircraft || 'N/A'}, ${flight.registration || 'N/A'}`, inline: true },
      { name: 'Departure Time', value: `<t:${Math.floor(parseStaffTime(flight.date || flight.staffTime)?.getTime() / 1000) || 0}:F>`, inline: true }
    ])
    .setColor('#002370')
    .setTimestamp();
}

/**
 * Schedules briefing DM release 1 hour (60 mins) prior to departure.
 */
async function scheduleReminders(client, allocation, minutesBefore = 60) {
  const flight = allocation.flight || {};
  const timeStr = flight.date || flight.timestamp || flight.staffTimeUtc || flight.staffTime;
  const staffDate = parseStaffTime(timeStr);

  if (!staffDate) {
    console.warn(`Could not parse flight departure time for ${flight.number}: "${timeStr}"`);
    return;
  }

  // Calculate execution time (60 minutes prior to departure)
  const reminderTime = new Date(staffDate.getTime() - minutesBefore * 60 * 1000);
  const now = Date.now();
  const delay = reminderTime.getTime() - now;

  if (delay <= 0) {
    console.log(`Briefing release time already passed for flight ${flight.number}`);
    return;
  }

  console.log(`⏰ Briefing release scheduled for flight ${flight.number} in ${Math.round(delay / 60000)} minutes.`);

  setTimeout(async () => {
    try {
      const Allocation = require('../models/Allocation');
      const latest = await Allocation.findOne({ messageId: allocation.messageId });
      
      const userIdsToNotify = new Set();

      // 1. Collect users registered via database roles (if any)
      if (latest) {
        const roleKeys = [
          'dispatchCoordinator', 'dispatchSupervisor', 'captain', 
          'firstOfficer', 'cabinCrew', 'groundHandling', 'purser', 
          'tarmacSupervisor', 'bagDropAgent', 'gateAgent', 'loungeAttendant'
        ];
        roleKeys.forEach(role => {
          if (Array.isArray(latest[role])) {
            latest[role].forEach(id => userIdsToNotify.add(id));
          }
        });
      }

      // 2. Fetch users who reacted with 👍 on the flight post
      try {
        const channel = await client.channels.fetch(allocation.channelId);
        if (channel) {
          const message = await channel.messages.fetch(allocation.messageId);
          if (message) {
            const reaction = message.reactions.cache.get('👍');
            if (reaction) {
              const users = await reaction.users.fetch();
              users.filter(u => !u.bot).forEach(u => userIdsToNotify.add(u.id));
            }

            // Post a public briefing ping in the channel
            const mentions = Array.from(userIdsToNotify).map(id => `<@${id}>`).join(' ');
            await channel.send({
              content: `📢 **FLIGHT BRIEFING RELEASE** ${mentions}\nBriefing details for flight **${flight.number}** have been released! Flight departs in **1 hour**.`
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch reaction users or post briefing channel alert:', err.message);
      }

      // 3. DM all allocated users their briefing embed
      const embed = buildReminderEmbed(flight);

      for (const userId of userIdsToNotify) {
        try {
          const user = await client.users.fetch(userId);
          await user.send({ embeds: [embed] });
        } catch (err) {
          console.warn(`Could not DM user ${userId}:`, err.message);
        }
      }

      console.log(`✅ Released briefing for flight ${flight.number} to ${userIdsToNotify.size} users.`);
    } catch (err) {
      console.error('Error executing scheduled briefing release:', err);
    }
  }, delay);
}

module.exports = { scheduleReminders, parseStaffTime };