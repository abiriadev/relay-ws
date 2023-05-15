import { z } from 'zod'

export type Wsid = string

const zls = z.object({
	type: z.literal('ls'),
})

const zsdp = z.object({
	type: z.enum(['ice', 'offer', 'answer']),
	from: z.string().length(21).optional(),
	to: z.string().length(21),
	sdp: z.string(),
})

export const reqSchema = zls.or(zsdp)

export type Req = z.infer<typeof reqSchema>

export type Res =
	| { type: 'ls'; peers: Array<Wsid> }
	| Required<z.infer<typeof zsdp>>
