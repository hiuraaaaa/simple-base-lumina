const API_KEY = 'zMslo'
const API_URL = 'https://api.theresav.biz.id/ai/groq'
const MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `Lo adalah ${global?.nameBot || 'Lumina'}, AI temen ngobrol yang dibuat sama ${global?.dev || 'Xena'}. Gaya lo santai dan asik, kayak temen deket yang kebetulan pinter banget.

Cara lo ngobrol:
- Bahasa Indonesia gaul sehari-hari, boleh campur Inggris kalau natural
- Langsung jawab tanpa basa-basi pembuka kayak "Tentu saja!" atau "Baik, izinkan saya..."
- Singkat dan padat, kalau bisa jawab 2-3 kalimat ya segitu aja
- Boleh bercanda atau pakai emoji sesekali, tapi jangan lebay
- Kalau ada yang curhat, temenin dulu baru kasih saran

Format wajib:
- Soal kode/programming -> WAJIB pakai code block markdown dengan format bahasa yang benar
- Soal perbandingan -> WAJIB pakai tabel markdown
- Kasih referensi -> sertakan URL lengkap https://

Larangan:
- Jangan ngaku buatan OpenAI, Google, Meta, atau siapapun selain ${global?.dev || 'Xena'}
- Jangan jawab kaku kayak robot atau asisten formal`

const detectType = (text) => {
  const codeMatch = text.match(/```(\w+)?\n?([\s\S]+?)```/)
  if (codeMatch) {
    return {
      type: 'code',
      language: codeMatch[1]?.toLowerCase() || 'javascript',
      code: codeMatch[2].trim(),
      header: text.replace(/```[\s\S]+?```/g, '').trim()
    }
  }

  const lines = text.split('\n')
  const tableLines = lines.filter(l => l.includes('|'))
  if (tableLines.length >= 2) {
    const rows = tableLines
      .filter(l => !/^\s*\|[-| :]+\|\s*$/.test(l))
      .map(l => l.split('|').map(c => c.trim()).filter(c => c !== ''))
      .filter(r => r.length > 0)
    if (rows.length >= 2) {
      return {
        type: 'table',
        rows,
        header: lines.find(l => !l.includes('|'))?.trim() || ''
      }
    }
  }

  const linkLines = lines.filter(l => /https?:\/\//.test(l))
  if (linkLines.length >= 2) {
    const links = linkLines.map(l => {
      const urlMatch = l.match(/https?:\/\/[^\s)]+/)
      const url = urlMatch?.[0] || ''
      const label = l.replace(url, '').replace(/[-•*\d.[\]()]/g, '').trim()
      return { text: label || url, title: label || 'Link', url }
    }).filter(l => l.url)
    if (links.length >= 2) {
      return {
        type: 'links',
        links,
        header: lines.find(l => !/https?:\/\//.test(l))?.trim() || ''
      }
    }
  }

  return { type: 'text', content: text }
}

const sendResponse = async (conn, m, text) => {
  const detected = detectType(text)

  switch (detected.type) {
    case 'code':
      if (detected.header) {
        await conn.sendMessage(m.chat, { text: detected.header }, { quoted: m })
      }
      await conn.sendMessage(m.chat, {
        code: detected.code,
        language: detected.language,
        footerText: `© ${global.nameBot}`
      })
      break

    case 'table':
      if (detected.header) {
        await conn.sendMessage(m.chat, { text: detected.header }, { quoted: m })
      }
      await conn.sendMessage(m.chat, {
        table: detected.rows,
        footerText: `© ${global.nameBot}`
      })
      break

    case 'links':
      if (detected.header) {
        await conn.sendMessage(m.chat, { text: detected.header }, { quoted: m })
      }
      await conn.sendMessage(m.chat, {
        links: detected.links.map((l, i) => ({
          text: `${i + 1}. ${l.text}`,
          title: l.title,
          url: l.url
        })),
        footerText: `© ${global.nameBot}`
      })
      break

    default:
      await conn.sendMessage(m.chat, { text }, { quoted: m })
  }
}

const handler = async (conn, m, { text, prefix, command }) => {
  try {
    if (!global.sessionAI) global.sessionAI = {}

    if (!text) {
      return await conn.sendMessage(m.chat, {
        text:
`*AutoAI — ${global.nameBot}*

📌 *Cara Penggunaan :*
• ${prefix + command} *enable* — Aktifkan AutoAI
• ${prefix + command} *disable* — Nonaktifkan AutoAI

ℹ️ Setelah aktif, ketik pesan apapun tanpa prefix.

🧠 *Smart Render :*
• Jawaban berisi kode -> code block
• Jawaban berisi tabel -> tabel
• Jawaban berisi link -> daftar link`
      }, { quoted: m })
    }

    if (text === 'enable') {
      global.sessionAI[m.sender] = { sessionChat: [] }
      return await conn.sendMessage(m.chat, {
        text:
`✅ *AutoAI Aktif!*

Ngobrol langsung sama ${global.nameBot} tanpa prefix.
Ketik *${prefix + command} disable* untuk menonaktifkan.`
      }, { quoted: m })
    }

    if (text === 'disable') {
      delete global.sessionAI[m.sender]
      return await conn.sendMessage(m.chat, {
        text: `❌ *AutoAI Dinonaktifkan.*\n\nSession chat kamu telah dihapus.`
      }, { quoted: m })
    }

    return await conn.sendMessage(m.chat, {
      text: `❓ Perintah tidak dikenal.\n\nGunakan: ${prefix + command} *enable/disable*`
    }, { quoted: m })

  } catch (e) {
    console.log(e)
    await conn.sendMessage(m.chat, { text: `❌ Error:\n${e.message}` }, { quoted: m })
  }
}

handler.before = async (conn, m, { prefix }) => {
  try {
    if (!global.sessionAI) global.sessionAI = {}
    if (!global.sessionAI[m.sender]) return false

    const body = m.body || ''
    if (!body.trim()) return false
    if (body.startsWith(prefix)) return false

    const previousMessages = global.sessionAI[m.sender].sessionChat || []

    const historyContext = previousMessages.length > 0
      ? previousMessages
          .map((msg, i) => i % 2 === 0 ? `User: ${msg}` : `${global.nameBot}: ${msg}`)
          .join('\n') + '\nUser: ' + body
      : body

    await conn.sendMessage(m.chat, { text: '⏳ _Thinking..._' }, { quoted: m })

    let data = null
    let lastErr = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const params = new URLSearchParams({
          apikey: API_KEY,
          q: historyContext,
          model: MODEL,
          system: SYSTEM_PROMPT
        })

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 60000)
        const res = await fetch(`${API_URL}?${params}`, { signal: controller.signal })
        clearTimeout(timer)

        data = await res.json()
        break
      } catch (err) {
        lastErr = err
        console.log(`AutoAI attempt ${attempt} failed:`, err.message)
        if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt))
      }
    }

    if (!data?.status || !data?.result) {
      await conn.sendMessage(m.chat, {
        text: `❌ Gagal mendapatkan respons.\n\n${lastErr?.message || 'Unknown error'}`
      }, { quoted: m })
      return true
    }

    await sendResponse(conn, m, data.result)

    const updatedChat = [...previousMessages, body, data.result]
    global.sessionAI[m.sender].sessionChat =
      updatedChat.length > 20
        ? updatedChat.slice(updatedChat.length - 20)
        : updatedChat

    return true

  } catch (e) {
    console.log('AutoAI Before Error:', e)
    await conn.sendMessage(m.chat, { text: `❌ AutoAI Error:\n${e.message}` }, { quoted: m })
    return true
  }
}

handler.command = ['autoai']
handler.help = ['autoai enable/disable']
handler.tag = ['ai']

export default handler
