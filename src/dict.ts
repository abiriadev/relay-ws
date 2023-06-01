import WebSocket from 'ws'
import { nanoid } from 'nanoid'
import { Wsid } from './types.js'

const n2st = (n: number) =>
	({
		[WebSocket.CONNECTING]: 'CONNECTING',
		[WebSocket.OPEN]: 'OPEN',
		[WebSocket.CLOSING]: 'CLOSING',
		[WebSocket.CLOSED]: 'CLOSED',
	}[n] ??
	(() => {
		throw new Error(`${n} is not a valid state`)
	})())

export class Dict {
	#d: Map<Wsid, WebSocket> = new Map()

	get(id: Wsid): WebSocket | null {
		return this.#d.get(id) ?? null
	}

	add(ws: WebSocket): Wsid {
		const id = nanoid()
		this.#d.set(id, ws)
		return id
	}

	delete(id: Wsid): void {
		this.#d.delete(id)
	}

	remove(ws: WebSocket): void {
		const id = this.ws2id(ws)
		id && this.#d.delete(id)
	}

	#fillter(pred: (ws: WebSocket) => boolean) {
		return [...this.#d.entries()]
			.filter(([, ws]) => pred(ws))
			.map(([id]) => id)
	}

	ids() {
		return this.#fillter(
			ws => ws.readyState === WebSocket.OPEN,
		)
	}

	ids_without_id(id: Wsid) {
		return this.ids().filter(i => i !== id)
	}

	ids_without_ws(me: WebSocket) {
		return this.#fillter(
			ws =>
				ws.readyState === WebSocket.OPEN &&
				ws !== me,
		)
	}

	ws2id(ws: WebSocket): Wsid | null {
		return (
			[...this.#d.entries()].find(
				([, v]) => v === ws,
			)?.[0] ?? null
		)
	}

	toJSON(): Record<Wsid, number> {
		return [...this.#d.entries()].reduce(
			(p, [k, v]) => ({
				...p,
				[k]: n2st(v.readyState),
			}),
			{},
		)
	}

	forEach(p: (ws: WebSocket, id: Wsid) => void) {
		this.#d.forEach(p)
	}
}
