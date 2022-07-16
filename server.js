import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import HostIP from './host-ip.js'
import open from 'open'
import { resolve } from 'path'

const PORT = Number(process.env.PORT) || 9090
const GAME_URL = `http://${HostIP}:${PORT}/`
const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer)


const __dirname = resolve();
app.use('/public', express.static('public'))
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'))

io.on('connection', (socket) => {
    socket.on('talking',  (data) => io.emit('listening', data))
})

httpServer.listen(PORT, () => {
    console.log('Listening on ', GAME_URL)
    open(`${GAME_URL}`)
  })