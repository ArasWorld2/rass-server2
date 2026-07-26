const { SlashCommandBuilder } = require('discord.js');
const Allocation = require('../models/Allocation');
const { scheduleReminders } = require('../utils/reminder');
const { checkRole } = require('../utils/checkRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Manually trigger or reschedule briefing reminders for a flight')
    .addStringOption(o => o.setName('message_id').setDescription('The message ID of the flight post').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes prior to flight departure to release briefing').setRequired(false)),

  async execute(interaction) {
    if (!await checkRole(interaction)) return;
    await interaction.deferReply({ flags: 64 });

    const messageId = interaction.options.getString('message_id');
    const minutes = interaction.options.getInteger('minutes') ?? 60;

    const allocation = await Allocation.findOne({ messageId });

    if (!allocation) {
      return interaction.editReply(`❌ Could not find a flight record associated with message ID \`${messageId}\`.`);
    }

    scheduleReminders(interaction.client, allocation, minutes);

    await interaction.editReply(`✅ Briefing release scheduled for flight **${allocation.flight?.number || 'N/A'}** **${minutes} minutes** prior to departure.`);
  },
};