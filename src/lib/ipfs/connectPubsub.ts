import { IIPFSPromiseApi } from "ipfs-types/lib/ipfs/index";
import { IIPFSPubsubApi, IIPFSPubsubMsg } from "ipfs-types/lib/ipfs/pubsub";
import console from '../console2';
import { unsubscribeAll } from 'ipfs-util-lib/lib/ipfs/pubsub/unsubscribe';
import Bluebird from 'bluebird';
import { parse, stringify } from '@lazy-ipfs/buffer-json';
import { cid as isCID } from 'is-ipfs';

const EPUB_TOPIC = 'novel-opds-now';

export async function connectPubsub(ipfs: IIPFSPromiseApi, options?: {
	pubsubHandler?(msg: IIPFSPubsubMsg, ipfs: IIPFSPromiseApi, ipfsID: string)
})
{
	const { id: ipfsID } = await ipfs.id().catch(e => ({} as any))

	const pubsubHandlerFn = async (msg: IIPFSPubsubMsg) =>
	{
		await pubsubHandler(msg, ipfs, ipfsID);

		return options?.pubsubHandler?.(msg, ipfs, ipfsID)
	}

	console.info(`嘗試連接 Pubsub 節點`);

	await ipfs
		.pubsub
		.subscribe(EPUB_TOPIC, pubsubHandlerFn)
	;

	console.info(`嘗試連接 Peers 節點`);

	await connectPeersAll(ipfs, ipfsID);

	const unsubscribe = async () =>
	{
		return ipfs.pubsub.unsubscribe(EPUB_TOPIC, pubsubHandlerFn)
			.catch(e => console.error(e))
	}

	await pubsubPublishHello(ipfs, ipfsID).catch(e => null)

	console.info(`連接 Pubsub 節點 完成`);

	return {
		unsubscribe,
	}
}

export function connectPeersAll(ipfs: IIPFSPromiseApi, ipfsID: string)
{
	return Bluebird
		.each(getPeers(ipfs), async (peerID) =>
		{
			return connectPeers(ipfs, peerID, ipfsID)
		})
}

export async function getPeers(ipfs: IIPFSPubsubApi): Promise<string[]>
{
	return ipfs.pubsub.peers(EPUB_TOPIC)
		.catch(e =>
		{
			console.warn(`[pubsub.peers]`, e)
			return [] as string[]
		})
}

export async function connectPeers(ipfs: IIPFSPromiseApi, peerID: string, ipfsID: string)
{
	return (ipfsID !== peerID) && Bluebird
		.any([
			ipfs.swarm.connect(`/dns4/ws-star-signal-1.servep2p.com/tcp/443/wss/p2p-websocket-star/ipfs/${peerID}`)
				.catch(e =>
				{

					if (String(e).includes('unknown protocol wss'))
					{
						return;
					}

					console.warn(`[connectPeers]`, e)
				}),
			ipfs.swarm.connect(`/p2p-circuit/ipfs/${peerID}`)
				.catch(e => console.warn(`[connectPeers]`, e)),
		])
		.catch(e =>
		{
			console.error(`[connectPeers]`, e)
		})
		.finally(() => {
			console.info(`[connectPeers]`, peerID)
		})
		;
}

export async function pubsubPublishHello(ipfs: IIPFSPromiseApi, ipfsID: string)
{
	return pubsubPublish(ipfs, EPUB_TOPIC, {
		peerID: ipfsID,
		type: 1,
	});
}

export async function pubsubPublish<T>(ipfs: IIPFSPromiseApi, topic: string, data: T)
{
	return ipfs
		.pubsub
		.publish(topic, stringify(data))
		.catch(e => console.error(`[pubsubPublish]`, e))
		;
}

export async function pubsubHandler(msg: IIPFSPubsubMsg, ipfs: IIPFSPromiseApi, ipfsID: string)
{
	if (!ipfs) return;

	try
	{
		const json = parse<{
			peerID?: string,
			type?: number,
			cid?: string,
		}>(msg.data);

		if (json)
		{
			console.info({
				...msg,
				json,
			})

			if (msg.topicIDs.includes(EPUB_TOPIC))
			{
				if (json.peerID && json.type)
				{
					await connectPeers(ipfs, json.peerID, ipfsID)
				}
			}

			if (json.cid && ipfsID !== msg.from)
			{
				const res = await ipfs
					// @ts-ignore
					.resolve((isCID(json.cid) ? '/ipfs/' : '') + json.cid)
					.catch(e => null)
				;

				//console.debug(`pubsubHandler`, res)
			}
		}
	}
	catch (e)
	{
		//console.debug(`pubsubHandler:error`, e)
	}

	//console.debug(`pubsubHandler:raw`, msg)

	return connectPeers(ipfs, msg.from, ipfsID);
}

export default connectPubsub
