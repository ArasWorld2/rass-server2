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
    .addStringOption(o => o.setName('date').setDescription('Flight timestamp or date string').setRequired(true))
    .addStringOption(o => o.setName('gate').setDescription('Gate & Stand (e.g. B12 / Stand 4)').setRequired(false))
    .addStringOption(o => o.setName('dep_runway').setDescription('Departure Runway (e.g. 29)').setRequired(false))
    .addStringOption(o => o.setName('arr_runway').setDescription('Arrival Runway (e.g. 27L)').setRequired(false)),

  async execute(interaction) {
    if (!await checkRole(interaction)) return;
    await interaction.deferReply({ flags: 64 });

    const flight = {
      number:       interaction.options.getString('number').toUpperCase(),
      from:         interaction.options.getString('from'),
      to:           interaction.options.getString('to'),
      aircraft:     interaction.options.getString('aircraft'),
      registration: interaction.options.getString('registration'),
      date:         interaction.options.getString('date'),
      timestamp:    interaction.options.getString('date'),
      gate:         interaction.options.getString('gate') || 'TBA',
      depRunway:    interaction.options.getString('dep_runway') || 'TBA',
      arrRunway:    interaction.options.getString('arr_runway') || 'TBA',
    };

    const messageContent = buildMainEmbed(flight);

    // Send plain message text (No embed container)
    const message = await interaction.channel.send({ content: messageContent });

    // React with custom LOTSYes reaction
    await message.react('1519638064945954908');

    // Save allocation record in DB including the host's ID as dispatcher
    const allocation = await Allocation.create({
      messageId: message.id,
      channelId: interaction.channelId,
      dispatcherId: interaction.user.id,
      flight,
    });

    // Schedule briefing release for 1 hour prior to flight
    scheduleReminders(interaction.client, allocation, 60);

    await interaction.editReply(`✅ Flight **${flight.number}** schedule posted! Briefing release scheduled for 1 hour prior to departure.`);
  },
};