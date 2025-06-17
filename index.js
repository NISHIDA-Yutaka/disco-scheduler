import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// スラッシュコマンド定義
const commands = [
  new SlashCommandBuilder()
    .setName('scheduler')
    .setDescription('イベント日程を調整します')
    .addStringOption(option =>
      option.setName('title').setDescription('イベントのタイトル').setRequired(true))
    .addStringOption(option =>
      option.setName('datetimes').setDescription('候補日時（例: 06201200,06211300）').setRequired(true))
].map(command => command.toJSON());

// コマンド登録
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('📦 スラッシュコマンドを登録中...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ スラッシュコマンド登録完了');
  } catch (error) {
    console.error(error);
  }
})();

// ユーティリティ関数: 日付文字列を人間が読める形式に変換
function formatDatetime(raw) {
  const now = new Date();
  const month = parseInt(raw.slice(0, 2), 10) - 1;
  const day = parseInt(raw.slice(2, 4), 10);
  const hour = parseInt(raw.slice(4, 6), 10);
  const minute = parseInt(raw.slice(6, 8), 10);
  const date = new Date(now.getFullYear(), month, day, hour, minute);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}月${date.getDate()}日(${weekdays[date.getDay()]}) ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

client.once('ready', () => {
  console.log(`🤖 ログイン成功: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'scheduler') {
    const title = interaction.options.getString('title');
    const datetimesRaw = interaction.options.getString('datetimes').split(',');

    if (datetimesRaw.length > 10) {
      await interaction.reply({ content: '候補は最大10個までにしてください。', ephemeral: true });
      return;
    }

    let description = '参加できる日時にリアクションをお願いします\n\n';
    const formatted = datetimesRaw.map((dt, i) => `${emojiNumbers[i]} ${formatDatetime(dt)}`).join('\n');
    description += formatted;
    description += `\n❌ 参加できません。私は今シンガポールにいます`;

    const embed = {
      title: `📅 ${title} - 日程候補`,
      description,
      color: 0x00bfff
    };

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < datetimesRaw.length; i++) {
      await message.react(emojiNumbers[i]);
    }

    await message.react('❌'); // 参加できません用のリアクション
  }
});

client.login(TOKEN);
