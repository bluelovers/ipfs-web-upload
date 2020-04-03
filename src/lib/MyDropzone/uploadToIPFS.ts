import { FileWithPath } from 'react-dropzone';
import { IFileWithPathWithCid } from '../../component/MyDropzone/MyFileList';
import Bluebird from 'bluebird';
import FileReader from '@tanker/file-reader';
import { IIPFSFileApi } from 'ipfs-types/lib/ipfs/file';
import { filterList, IIPFSAddressesLike, ipfsServerList } from 'ipfs-server-list';
import publishToIPFSRace from 'fetch-ipfs/put';
import { IPublishToIPFSReturn } from 'fetch-ipfs/lib/put/types';
import console from '../../lib/console2';

export const createStreams = async (acceptedFiles: IFileWithPathWithCid[], chunkSize: number) =>
{
	let totalSize = 0;

	const streams = await Bluebird
		.resolve(acceptedFiles)
		.map(async (file: FileWithPath) =>
		{
			totalSize += file.size;

			const ai = async function* ()
			{
				const reader = new FileReader(file);

				let chunk;
				do
				{
					//console.log(file.path, chunk)
					chunk = await reader.readAsArrayBuffer(chunkSize);

					yield chunk
				}
				while (chunk.byteLength > 0);
			};

			return {
				path: file.path,
				content: ai(),
				size: file.size,
			}
		})
	;

	return {
		streams,
		totalSize,
	}
}

export interface IUploadToIPFS
{
	ipfs: IIPFSFileApi,

	updateProgress?(sent: number, totalSize: number): any,

	serverList: IIPFSAddressesLike['API'][],
	acceptedFiles: IFileWithPathWithCid[],
	chunkSize: number,
}

async function pushToIPFS({

	ipfs,
	updateProgress,

	acceptedFiles,
	chunkSize,

}: Omit<IUploadToIPFS, 'serverList' | 'ipfs'> & {
	ipfs: IIPFSFileApi | IIPFSFileApi[] | IIPFSAddressesLike['API'][] | IIPFSAddressesLike['API'],
})
{
	let { streams, totalSize } = await createStreams(acceptedFiles, chunkSize);

	let progressFn;

	if (updateProgress)
	{
		let totalSend: number = 0;
		progressFn = (sent: number) => updateProgress(sent, totalSize)
	}

	return publishToIPFSRace(streams, Array.isArray(ipfs) ? ipfs : [ipfs], {
		addOptions: {
			wrapWithDirectory: true,
			progress: progressFn,
			// @ts-ignore
			recursive: true,
		},
		timeout: 60 * 60 * 1000,
	})
}

export default function ({

	ipfs,
	updateProgress,

	serverList,

	acceptedFiles,
	chunkSize,

}: IUploadToIPFS)
{
	return new Promise<IPublishToIPFSReturn>((resolve, reject) =>
	{

		let err: IPublishToIPFSReturn;

		const resolve2 = (result: IPublishToIPFSReturn) =>
		{
			if (result?.[0]?.status === 'fulfilled')
			{
				resolve(result)
			}
			else if (result)
			{
				// @ts-ignore
				let value = result[0].value || result[0].reason.value;
				if (value.length)
				{
					err = result;

					console.warn(result[0].status, result[0])
				}
			}
			else
			{
				console.error(result)
			}
		}

		Promise.all([
				pushToIPFS({
					ipfs,
					updateProgress,

					acceptedFiles,
					chunkSize,
				})
					.then(resolve2)
					.catch(e => console.error(`[pushToIPFS:1]`, e)),

				Bluebird
					.each(serverList, async (ipfs) =>
					{

						return pushToIPFS({
							ipfs,

							acceptedFiles,
							chunkSize,
						})
							.then(resolve2)
							.catch(e => console.error(`[pushToIPFS:2]`, e))
							;

					}),
			])
			.then(() => resolve(err))
	})
}
