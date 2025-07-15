const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")
const axios = require("axios")
const sharp = require("sharp")
const { OpenAI } = require("openai")

const openai = new OpenAI({ apiKey: "ISI_KEY_OPENAI_MU" })

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text

    if (text == "!menu") {
      await sock.sendMessage(from, { text: "💎 *SA STORE12 BOT*\n\n1. !sticker – kirim foto untuk buat sticker\n2. !harga – lihat list harga diamond\n3. !ai <pertanyaan> – tanya AI" })
    }

    if (text == "!harga") {
      const harga = JSON.parse(fs.readFileSync("./config.json"))
      let out = "*💎 HARGA DIAMOND SA STORE12 💎*\n\n"

      for (let game in harga) {
        out += `📌 *${game.toUpperCase()}*\n`
        for (let item in harga[game]) {
          out += `- ${item}: ${harga[game][item]}\n`
        }
        out += `\n`
      }
      await sock.sendMessage(from, { text: out })
    }

    if (text && text.startsWith("!ai ")) {
      const query = text.replace("!ai ", "")
      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: query }]
      })
      await sock.sendMessage(from, { text: res.choices[0].message.content })
    }

    if (msg.message.imageMessage) {
      const buffer = await sock.downloadMediaMessage(msg)
      sharp(buffer)
        .resize(512)
        .webp()
        .toBuffer()
        .then(async (sticker) => {
          await sock.sendMessage(from, { sticker: { url: sticker } })
        })
    }
  })
}

startBot()
