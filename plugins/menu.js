const tagEmoji = {
  main: '✨', ai: '🧠', download: '📥', search: '🔍',
  owner: '⚙️', info: 'ℹ️', stalk: '🕵️', tools: '🛠️',
  game: '🎮', fun: '🎉',
}

const tagOrder = ['ai', 'download', 'search', 'info', 'stalk', 'tools', 'game', 'fun', 'other', 'owner']

let handler = async (conn, m, { prefix, command }) => {

  // ─── SUB MENU KATEGORI (.menu-ai, .menu-download, dst) ───────────────────
  if (command.startsWith('menu-')) {
    const tag = command.replace(/^menu-/i, '').toLowerCase()
    const emoji = tagEmoji[tag] || '📌'
    const label = tag.charAt(0).toUpperCase() + tag.slice(1)

    const list = []
    for (const plugin of Object.values(global.plugins)) {
      if (!plugin.command?.length) continue
      if ((plugin.tag?.[0] || 'other').toLowerCase() !== tag) continue
      const help = plugin.help?.[0] || plugin.command[0]
      list.push(`• ${prefix}${help}`)
    }

    if (!list.length) {
      return conn.sendMessage(
        m.chat,
        { text: `Tidak ada plugin di kategori *${label}*.` },
        { quoted: m }
      )
    }

    const text = [
      `╭─「 ${emoji} *${label} Menu* 」`,
      `│`,
      ...list.map(item => `├ ${item}`),
      `│`,
      `╰─「 © ${global.nameBot} 」`
    ].join('\n')

    return conn.sendMessage(
      m.chat,
      {
        image: { url: global.thumb },
        caption: text,
        footer: `© ${global.nameBot}`,
        buttons: [{ text: '« Kembali ke Menu', id: `${prefix}menu` }]
      },
      { quoted: m }
    )
  }

  // ─── MENU UTAMA (.menu) ───────────────────────────────────────────────────
  const runtime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const mnt = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    return [
      d ? `${d} Hari` : '',
      h ? `${h} Jam` : '',
      mnt ? `${mnt} Menit` : '',
      s ? `${s} Detik` : ''
    ].filter(Boolean).join(' ')
  }

  // Hitung plugin per tag
  const tagCount = {}
  for (const plugin of Object.values(global.plugins)) {
    if (!plugin.command?.length || plugin.command.includes('menu')) continue
    const tag = (plugin.tag?.[0] || 'other').toLowerCase()
    if (tag === 'main') continue
    tagCount[tag] = (tagCount[tag] || 0) + 1
  }

  const allTags = [
    ...tagOrder.filter(t => tagCount[t]),
    ...Object.keys(tagCount).filter(t => !tagOrder.includes(t)).sort()
  ]

  const totalCmd = Object.values(global.plugins)
    .filter(p => p.command?.length && !p.command.includes('menu'))
    .length

  const sections = [
    {
      title: '📋 Semua Menu',
      rows: [{
        title: '📋 All Menu',
        description: 'Tampilkan semua fitur bot sekaligus',
        id: `${prefix}allmenu`
      }]
    },
    {
      title: '🗂️ Pilih Kategori',
      rows: allTags.map(tag => ({
        title: `${tagEmoji[tag] || '📌'} Menu ${tag.charAt(0).toUpperCase() + tag.slice(1)}`,
        description: `${tagCount[tag]} fitur tersedia — klik untuk lihat`,
        id: `${prefix}menu-${tag}`
      }))
    }
  ]

  const date = new Date()
  const tanggal = date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long',
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const waktu = date.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const text = `
𝙒𝙚𝙡𝗰𝗼𝗺𝗲 𝘁𝗼 ${global.nameBot}

❑ ᴜsᴇʀɴᴀᴍᴇ : ${m.pushName || 'User'}
❑ ᴅᴇᴠᴇʟᴏᴘᴇʀ : ${global.dev}
❑ ᴏᴡɴᴇʀ : ${global.ownerName}
❑ ᴘʀᴇғɪx : ${global.prefix}
❑ ᴠᴇʀsɪᴏɴ : ${global.version}
❑ ᴘʟᴜɢɪɴs : ${totalCmd} Command

➥ ᴅᴀᴛᴇ : ${tanggal}
➥ ᴛɪᴍᴇ : ${waktu} WIB
➥ ʀᴜɴᴛɪᴍᴇ : ${runtime(process.uptime())}

ᴘʟᴇᴀsᴇ sᴇʟᴇᴄᴛ ᴛʜᴇ ᴍᴇɴᴜ ʙᴇʟᴏᴡ.`

  await conn.sendMessage(
    m.chat,
    {
      image: { url: global.thumb },
      caption: text,
      footer: `© ${global.nameBot}`,
      buttons: [
        { text: 'Contact Owner', id: `${prefix}owner` },
        { text: 'Developer', id: `${prefix}dev` },
        { text: 'List Menu', sections }
      ]
    },
    { quoted: m }
  )
}

// ─── Build command list: 'menu' + semua 'menu-<tag>' ─────────────────────────
const buildCommands = () => {
  const tags = new Set()
  for (const plugin of Object.values(global.plugins || {})) {
    if (!plugin.command?.length || plugin.command.includes('menu')) continue
    const tag = (plugin.tag?.[0] || 'other').toLowerCase()
    if (tag !== 'main') tags.add(tag)
  }
  handler.command = ['menu', ...[...tags].map(t => `menu-${t}`)]
}

// Set dulu, update lagi setelah semua plugin loaded
handler.command = ['menu']
setTimeout(buildCommands, 500)

handler.help = ['menu']
handler.tag = ['main']

export default handler
