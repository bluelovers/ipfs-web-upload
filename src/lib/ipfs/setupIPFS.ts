import console from '../console2';
import { findIpfsClient } from '@bluelovers/ipfs-http-client';
import { IIPFSPromiseApi } from "ipfs-types/lib/ipfs/index";
import tweakIPFSConfig from './tweakIPFSConfig';
import {
	IIPFSClientFnWrap,
	IIPFSClientFn,
	IIPFSClientReturn,
	IIPFSClientParameters,
	IIPFSClientAddressesURL,
	IIPFSClientAddresses,
} from '@bluelovers/ipfs-http-client/lib/types';
import { ipfsApiAddresses } from 'ipfs-util-lib';

declare global
{
	interface Window
	{
		ipfs: IIPFSPromiseApi;
	}
}

export function setupIPFS(serverList: (IIPFSClientAddresses | any)[])
{
	console.info(`搜尋可用的 IPFS API 伺服器...`);

	return findIpfsClient(serverList)
		.then(async (ipfs: IIPFSPromiseApi) =>
		{

			const { id: ipfsID } = await ipfs.id()
				.catch(e =>
				{

					console.error(`沒有權限取得 IPFS ID`, e);

					return {} as {
						id: string,
					}
				})
			;

			const ipfsAddresses: string = await ipfsApiAddresses(ipfs)
				.catch(e => console.error(`沒有權限取得 IPFS 伺服器位址`, e) as any)
			;

			console.info(`成功連接 IPFS API 伺服器`, ipfsAddresses, ipfsID);

			await tweakIPFSConfig(ipfs);

			return {
				ipfs,
				ipfsID,
				ipfsAddresses,
			}
		})
}

export default setupIPFS
