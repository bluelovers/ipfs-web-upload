import { filterList } from 'ipfs-server-list';
import { array_unique_overwrite } from 'array-hyper-unique';
import { ipfsGatewayAddressesLink } from 'ipfs-util-lib/lib/api/multiaddr';

export async function getIpfsGatewayList(ipfs)
{
	let ipfsGatewayMain: string;
	const ipfsGatewayList: string[] = [];

	await ipfsGatewayAddressesLink(ipfs)
		.then(gateway => {
			ipfsGatewayList.push(gateway);
		})
		.catch(e => null)
	;

	filterList('Gateway')
		.forEach(gateway => {
			ipfsGatewayList.push(gateway);
		})
	;

	array_unique_overwrite(ipfsGatewayList);

	return {
		ipfsGatewayMain,
		ipfsGatewayList,
	}
}

export default getIpfsGatewayList
