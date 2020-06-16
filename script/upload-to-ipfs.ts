// @ts-ignore
import useIPFS from 'use-ipfs';
import { join } from "path";
import addDirectoryToIPFS from 'ipfs-util-lib/lib/ipfs/addDirectory/v4';
import { ipfsWebuiAddresses } from 'ipfs-util-lib/lib/api/multiaddr';
import Bluebird from 'bluebird';
import { filterList, IIPFSAddressesLike, ipfsServerList } from 'ipfs-server-list';
import getIpfsGatewayList from '../src/lib/getIpfsGatewayList';
import { toLink as toIpfsLink } from 'to-ipfs-url';
import { pokeURL } from 'poke-ipfs';

export default useIPFS()
	.then(async ({
		ipfs,
		stop,
	}) => {

		await ipfsWebuiAddresses(ipfs)
			.then(v => console.info(v))
			.catch(e => null)
		;

		const targetPath = join(__dirname, '..', 'out');

		let ret = await addDirectoryToIPFS(ipfs, targetPath, {
			options: {
				pin: true,
				//progress: createProgressBar,
				wrapWithDirectory: false,
			},
			globSourceOptions: {
				hidden: true,
			},
		});

		const cid = ret.root.cid.toString();

		console.dir(ret.files.length);
		console.dir(cid);

		const { ipfsGatewayList } = await getIpfsGatewayList(ipfs)

		await Bluebird
			.resolve(ipfsGatewayList)
			.map((gateway, index) => {

				const href = toIpfsLink(cid, {
					prefix: {
						ipfs: gateway,
					},
				});

				return pokeURL(href, {
					//cors: true,
					timeout: 10 * 60 * 1000,
				})
					.then((response) => {
						console.info(response.value, href)
					})
					.catch(e => null)
		})

		return stop();
	})
;
