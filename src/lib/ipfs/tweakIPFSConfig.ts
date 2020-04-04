import configDefaultAll from 'ipfs-util-lib/lib/ipfs/config/default';
import { IIPFSPromiseApi } from 'ipfs-types/lib/ipfs/index';
import { IIPFSConfigApi } from 'ipfs-types/lib/ipfs/config';
import console from '../console2';

export function tweakIPFSConfig(ipfs: IIPFSConfigApi)
{
	return configDefaultAll(ipfs)
		.catch(e => {
			console.error(`[tweakIPFSConfig]`, e)
		})
}

export default tweakIPFSConfig
