import { z } from 'zod'

const wsidZ = z.string().length(21)

export type Wsid = z.infer<typeof wsidZ>

const zsdp = z.object({
	from: wsidZ.optional(),
	to: wsidZ,
	sdp: z.string(),
})

export const reqZ = z.discriminatedUnion('type', [
	z.object({ type: z.literal('ls') }),
	z.object({ type: z.literal('leave') }),
	zsdp.extend({ type: z.literal('ice') }),
	zsdp.extend({ type: z.literal('offer') }),
	zsdp.extend({ type: z.literal('answer') }),
])

export type Req = z.infer<typeof reqZ>

export type Router = {
	[K in Req['type']]: (
		id: Wsid,
		req: Omit<
			Req extends { type: infer I }
				? I extends K
					? Req
					: never
				: never,
			'type'
		>,
	) => [
		({
			ls: { peers: Array<Wsid> }
			leave: { from: Wsid }
		} & {
			[K in 'ice' | 'offer' | 'answer']: Required<
				z.infer<typeof zsdp>
			>
		})[K],
		Wsid,
	]
}
