import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import axios from 'axios'
import hmacSHA256 from 'crypto-js/hmac-sha256'
import Base64 from 'crypto-js/enc-base64'
import Hex from 'crypto-js/enc-hex'
import path from 'path'

// save dirname in a hacky way since it's undefined in .mjs otherwise
const __dirname = path.dirname(new URL(import.meta.url).pathname)

// load environment variables into process.env...
dotenv.config()

// ...and assign them for later use
const API_URL = process.env.API_URL
const API_INSTANCE = process.env.API_INSTANCE
const API_NONCE = process.env.API_NONCE
const API_SECRET = process.env.API_SECRET

// init app
const app = express()

// support json in request-payload
app.use(bodyParser.json())

// support CORS-requests
app.use(cors())

// set static directory to server files from
app.use(express.static(path.join(__dirname, '../client/dist')))

function computeRequestHeaders(data) {
  const hashString = `${API_NONCE}:${data}`
  const hash = hmacSHA256(hashString, API_SECRET)

  return {
    'Content-Type': 'application/json',
    'X-Makaira-Nonce': API_NONCE,
    'X-Makaira-Hash': Hex.stringify(hash),
    'X-Makaira-Instance': API_INSTANCE,
  }
}

app.get('/', (req, res) => {
  res.sendFile('index.html')
})

app.post('/search', (req, res) => {
  let data = req.body

  if (!data) return res.sendStatus(400)

  data = {
    ...req.body,
    fields: [
      'OXSHORTDESC',
      'MARM_OXSEARCH_MANUFACTURERTITLE',
      'OXPRICE',
      'OXPIC1',
      '_score',
    ],
  }
  data = JSON.stringify(data)

  const headers = computeRequestHeaders(data)

  axios
    .post(`${API_URL}/search/`, data, { headers })
    .then(response => res.send(response.data))
    .catch(error =>
      console.error(
        `ERROR: Request failed: ${error.response.status} (${
          error.response.statusText
        })`
      )
    )
})

app.listen(process.env.PORT || 4000)
