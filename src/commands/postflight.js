const { SlashCommandBuilder } = require('discord.js');
const Allocation = require('../models/Allocation');
const { buildMainEmbed } = require('../utils/embeds');
const { scheduleReminders } = require('../utils/reminder');
const { checkRole } = require('../utils/checkRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('postflight')
    .setDescription('Post a flight allocation schedule')
    .addStringOption(o => o.setName('number').setDescription('Flight number (e.g. LOXXXX)').setRequired(true))
    .addStringOption(o => o.setName('from').setDescription('Departure airport').setRequired(true))
    .addStringOption(o => o.setName('to').setDescription('Arrival airport').setRequired(true))
    .addStringOption(o => o.setName('aircraft').setDescription('Aircraft type (e.g. Boeing 737)').setRequired(true))
    .addStringOption(o => o.setName('registration').setDescription('Aircraft registration (e.g. SP-LWA)').setRequired(true))
    .addStringOption(o => o.setName('date').setDescription('Flight timestamp or date string').setRequired(true)),

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

    const embed = buildMainEmbed(flight);

    // 1. Send schedule embed
    const message = await interaction.channel.send({ embeds: [embed] });

    // 2. React with 👍 for allocations
    await message.react('👍');

    // 3. Save allocation document in MongoDB
    const allocation = await Allocation.create({
      messageId: message.id,
      channelId: interaction.channelId,
      flight,
    });

    // 4. Schedule 1h briefing release automation
    scheduleReminders(interaction.client, allocation, 60);

    await interaction.editReply(`✅ Flight **${flight.number}** schedule posted! Briefing release scheduled for 1 hour prior to departure.`);
  },
};