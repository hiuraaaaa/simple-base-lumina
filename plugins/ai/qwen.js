let handler = async (conn, m, { text, command, prefix }) => {
  try {
    if (!text) {
      return await conn.sendMessage(m.chat, {
        text: `❌ *Contoh Penggunaan*:\n${prefix + command} halo`
      }, { quoted: m })
    }

    const url = new URL('https://api.luminaa.web.id/ai-chat/qwenn')
    url.searchParams.set('apikey', 'lmn_fd4ff482ddf634071074c73e193c71e810a4eb3d')
    url.searchParams.set('prompt', text)
    url.searchParams.set('model', 'qwen3.5-plus')

    const res  = await fetch(url.toString())
    const data = await res.json()

    if (!data.status) throw new Error('Failed get AI response.')

    let result = data?.result?.response
    try {
      const parsed = JSON.parse(result)
      result = parsed?.message || parsed?.response || result
    } catch (_) {}

    if (!result) throw new Error('Empty response from AI.')

    const response = `
*𝙌𝙬𝙚𝙣 𝘼𝙄*

➥ ${result}`

    await conn.sendMessage(m.chat, {
      text: response,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363420019948650@newsletter',
          newsletterName: global.nameBot,
          serverMessageId: 1
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.log(e)
    await conn.sendMessage(m.chat, {
      text: `❌ *Error* : ${e.message}`
    }, { quoted: m })
  }
}

handler.command = ['qwen']
handler.help    = ['qwen <text>']
handler.tag     = ['ai']

export default handler

