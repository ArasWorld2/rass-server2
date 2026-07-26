const { SlashCommandBuilder } = require('discord.js');
const Allocation = require('../models/Allocation');
const { buildMainEmbed, buildButtons } = require('../utils/embeds');
const { scheduleReminders } = require('../utils/reminder');
const { checkRole } = require('../utils/checkRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('postflight')
    .setDescription('Post a flight allocation sheet')
    .addStringOption(o => o.setName('number').setDescription('Flight number (e.g. LOXXXX)').setRequired(true))
    .addStringOption(o => o.setName('from').setDescription('Departure airport').setRequired(true))
    .addStringOption(o => o.setName('to').setDescription('Arrival airport').setRequired(true))
    .addStringOption(o => o.setName('aircraft').setDescription('Aircraft type (e.g. Boeing 737)').setRequired(true))
    .addStringOption(o => o.setName('registration').setDescription('Aircraft registration (e.g. SP-LWA)').setRequired(true))
    .addStringOption(o => o.setName('date').setDescription('Flight date/timestamp (e.g. 1712345678 or Hammertime)').setRequired(true))
    .addIntegerOption(o => o.setName('reminder_minutes').setDescription('DM reminder time prior to flight (in minutes)').setRequired(false)),

  async execute(interaction) {
    if (!await checkRole(interaction)) return;
    await interaction.deferReply({ ephemeral: true });

    const flight = {
      number:       interaction.options.getString('number').toUpperCase(),
      from:         interaction.options.getString('from'),
      to:           interaction.options.getString('to'),
      aircraft:     interaction.options.getString('aircraft'),
      registration: interaction.options.getString('registration'),
      date:         interaction.options.getString('date'),
      timestamp:    interaction.options.getString('date'),
    };

    const reminderMinutes = interaction.options.getInteger('reminder_minutes') ?? 60;
    const embed   = buildMainEmbed(flight, {});
    const buttons = buildButtons();

    // 1. Send the flight embed message
    const message = await interaction.channel.send({
      embeds: [embed],
      components: buttons,
    });

    // 2. Add the thumbs up reaction (👍) requested for self-allocation
    await message.react('👍');

    // 3. Save allocation record to the database
    const allocation = await Allocation.create({
      messageId: message.id,
      channelId: interaction.channelId,
      flight,
    });

    // 4. Schedule briefing/reminders
    scheduleReminders(interaction.client, allocation, reminderMinutes);

    await interaction.editReply(`✅ Flight **${flight.number}** posted! Automatic briefing release scheduled for **${reminderMinutes} minutes** prior to departure.`);
  },
};