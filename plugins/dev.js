let handler = async (conn, m) => {

  const text = `
*Hello, ${m.pushName || 'User'} 👋*

Terima kasih telah menggunakan base bot ini.
Berikut informasi developer dan website

━━━━━━━━━━━━━━━
*INFORMASI DEVELOPER*

• *Nama :* ${global.dev || 'Xena'}
• *WhatsApp :* 62882006639544
• *GitHub :* github.com/hiuraaaaa
━━━━━━━━━━━━━━━
*INFORMASI WEBSITE*

• *Website :* xena.eu.cc
• *Rest API :* api.lumina.web.id
• *Snippet :* gits.lumina.web.id
━━━━━━━━━━━━━━━
© ${global.nameBot}`.trim()

  await conn.sendMessage(
    m.chat,
    {
      text,
      contextInfo: {
        forwardingScore: 999999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: 'Developer Information',
          newsletterJid:
            '1203634200199486501@newsletter'
        }
      }
    },
    { quoted: m }
  )
}

handler.command = ['dev', 'developer']
handler.help = ['dev']
handler.tag = ['main']

export default handler
