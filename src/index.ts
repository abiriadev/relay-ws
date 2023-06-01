import { WebSocketServer, WebSocket } from 'ws'
import destr from 'destr'
import signale from 'signale'
import chalk from 'chalk'
import { Dict } from './dict.js'
import { Req, Router, Wsid, reqZ } from './types.js'
import process, { env, exit } from 'node:process'

const dict = new Dict()

const sdpHandler: Router['ice'] = (from, { sdp, to }) => [
	{ sdp, to, from },
	to,
]

const mid: Router = {
	ls: id => [{ peers: dict.ids_without_id(id) }, id],
	leave: from => [{ from }, '*'],
	ice: sdpHandler,
	offer: sdpHandler,
	answer: sdpHandler,
}

const poru = env['PORT']
const port = poru === undefined ? 34098 : parseInt(poru)
const wss = new WebSocketServer({
	port,
})

wss.on('connection', ws => {
	const id = dict.add(ws)
	signale.start(`new connection: ${chalk.yellow(id)}`)
	console.dir(dict.toJSON())

	ws.on('error', signale.error)

	ws.on('message', data => {
		try {
			const j = destr(data.toString())
			console.log('recv: ', j)

			const r = reqZ.safeParse(j)
			if (!r.success)
				return signale.error(r.error.format())

			const { type, ...omitType } = r.data
			const [msg, toid] = mid[r.data.type](
				id,
				// @ts-ignore
				omitType,
			)

			if (toid === '*')
				return dict.forEach(ws =>
					ws.send(JSON.stringify(msg)),
				)

			const to = dict.get(toid)
			if (to === null)
				throw new Error(
					`websocket ${toid} does not exist`,
				)

			to.send(JSON.stringify(msg))
		} catch (e) {
			signale.error(e)
		}
	})

	ws.on('open', () => console.log('open'))

	ws.on(
		'close',
		(code, reason: string) => (
			dict.delete(id),
			signale.complete(
				`connection closed: ${chalk.yellow(
					id,
				)} (${code})${
					typeof reason === 'string'
						? `, reason: ${reason}`
						: ''
				}`,
			)
		),
	)
})

wss.on('error', () =>
	signale.error('internal server error'),
)

wss.on('listening', () =>
	signale.await(`listening for connection at ${port}`),
)

process.on('SIGINT', () => {
	signale.info('closing existing connections')
	dict.forEach(
		(socket, id) =>
			socket.readyState == WebSocket.OPEN &&
			(socket.close(1000, 'Server shutdown'),
			signale.info(`closing ${id}`)),
	)
	wss.close()
	signale.complete('shutdown successfully')
	exit(0)
})
