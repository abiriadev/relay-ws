import { WebSocketServer } from 'ws'
import destr from 'destr'
import signale from 'signale'
import chalk from 'chalk'
import { Dict } from './dict.js'
import { Req, Res, Wsid, reqSchema } from './types.js'
import { env } from 'node:process'

const dict = new Dict()

const mid = (req: Req, id: Wsid): [Res, Wsid] =>
	req.type === 'ls'
		? [
				{
					type: 'ls',
					peers: dict.ids_without_id(id),
				},
				id,
		  ]
		: [{ ...req, from: id }, req.to]

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

			const r = reqSchema.safeParse(j)
			if (!r.success)
				return signale.error(r.error.format())

			const [msg, toid] = mid(r.data, id)

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
