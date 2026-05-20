import axios from 'axios'
import FormData from 'form-data'
import { downloadContentFromMessage } from '@dnuzi/baileys'

if (!global.hdPending) global.hdPending = {}

async function getBuffer(message, type) {
  const stream = await downloadContentFromMessage(message, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

const handler = async (conn, m, { text, command, prefix }) => {
  try {
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const imageMsg = m.message?.imageMessage || quoted?.imageMessage || null

    // Simpan gambar kalau ada, untuk dipakai saat user pilih scale
    if (imageMsg) global.hdPending[m.sender] = imageMsg

    const pendingImg = global.hdPending[m.sender] || null

    // Belum pilih scale → tampilkan list
    if (!text?.trim() || !['2', '4'].includes(text.trim())) {
      const sections = [
        {
          title: '🔍 Pilih Scale',
          rows: [
            {
              title: '2x Enhancement',
              description: 'Tingkatkan kualitas gambar 2x',
              id: `${prefix}hd 2`
            },
            {
              title: '4x Enhancement',
              description: 'Tingkatkan kualitas gambar 4x',
              id: `${prefix}hd 4`
            }
          ]
        }
      ]

      return await conn.sendMessage(m.chat, {
        image: { url: global.thumb },
        caption: `🖼️ *HD Image Enhancer*\n\nPilih scale di bawah, lalu reply gambar.`,
        footer: `© ${global.nameBot}`,
        buttons: [{ text: 'Pilih Scale', sections }]
      }, { quoted: m })
    }

    // Sudah pilih scale, cek gambar (dari pesan ini atau pending)
    const targetImg = imageMsg || pendingImg
    if (!targetImg) {
      return await conn.sendMessage(m.chat, {
        text: `❌ Kirim/reply gambar dulu, lalu ketik:\n${prefix}hd 2 atau ${prefix}hd 4`
      }, { quoted: m })
    }

    const scale = text.trim()

    await conn.sendMessage(m.chat, { text: `⏳ Memproses gambar dengan scale ${scale}x...` }, { quoted: m })

    const buffer = await getBuffer(targetImg, 'image')

    // Hapus pending setelah dipakai
    delete global.hdPending[m.sender]

    const form = new FormData()
    form.append('apikey', 'zMslo')
    form.append('scale', scale)
    form.append('image', buffer, { filename: 'image.png', contentType: 'image/png' })

    const { data } = await axios.post('https://api.theresav.biz.id/tools/hd', form, {
      headers: { ...form.getHeaders() },
      responseType: 'arraybuffer',
      timeout: 60000
    })

    const resultBuffer = Buffer.from(data)
    if (!resultBuffer.length) throw new Error('Hasil gambar kosong.')

    await conn.sendMessage(m.chat, {
      image: resultBuffer,
      caption: `✅ *HD Enhancement Selesai*\n\n🔍 *Scale :* ${scale}x`,
      footer: `© ${global.nameBot}`
    }, { quoted: m })

  } catch (e) {
    console.log('[hd] error:', e?.response?.data || e.message)
    await conn.sendMessage(m.chat, {
      text: `❌ *HD Error*\n\n📌 *Details :*\n${e?.response?.data?.message || e.message}`
    }, { quoted: m })
  }
}

handler.command = ['hd']
handler.help    = ['hd (reply gambar)']
handler.tag     = ['tools']

export default handler

