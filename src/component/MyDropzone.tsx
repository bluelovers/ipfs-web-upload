import React, { PropsWithChildren, ReactNode, useMemo, useState, useEffect, RefObject } from 'react';
import Dropzone, { useDropzone, DropEvent, FileWithPath, DropzoneState, DropzoneRef } from 'react-dropzone';
import ipfsClient, { findIpfsClient } from '@bluelovers/ipfs-http-client';
import { filesToStreams } from 'ipfs-browser-util';
import { getDefaultServerList } from '@bluelovers/ipfs-http-client/core';
import { filterList, IIPFSAddressesLike, ipfsServerList } from 'ipfs-server-list';
import { IIPFSFileApi } from 'ipfs-types/lib/ipfs/file';
import Bluebird from 'bluebird';
import FileReader from '@tanker/file-reader';
import publishToIPFSRace from 'fetch-ipfs/put';
import { toLink as toIpfsLink, toURL as toIpfsURL } from 'to-ipfs-url';
import { array_unique_overwrite } from 'array-hyper-unique';
import prettyBytes from 'pretty-bytes';
import { ipfsGatewayAddressesLink } from 'ipfs-util-lib/lib/api/multiaddr';
import MainCid from './MyDropzone/MainCid';
import MyFileList, { IFileWithPathWithCid } from './MyDropzone/MyFileList';
import PanelTools from './PanelTools';

const baseStyle = {
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	padding: '20px',
	borderWidth: 10,
	borderRadius: 5,
	borderColor: '#eeeeee',
	borderStyle: 'dashed',
	backgroundColor: '#fafafa',
	color: '#bdbdbd',
	outline: 'none',
	transition: 'border .24s ease-in-out',
};

const activeStyle = {
	borderColor: '#2196f3',
};

const acceptStyle = {
	borderColor: '#00e676',
};

const rejectStyle = {
	borderColor: '#ff1744',
};

const uploadingStyle = {
	borderColor: '#ff008c',
};

export default ({

	dropzoneRef,

	acceptedFiles,
	getRootProps,
	getInputProps,
	isDragActive,
	isDragAccept,
	isDragReject,

	isFileDialogActive,
	isFocused,

	rootRef, // Ref to the `<div>`
	inputRef, // Ref to the `<input>`

}: DropzoneState & {
	dropzoneRef: RefObject<DropzoneRef>,
}) =>
{
	/*
	const {
		acceptedFiles,
		getRootProps,
		getInputProps,
		isDragActive,
		isDragAccept,
		isDragReject,

		isFileDialogActive,
		isFocused,

		rootRef, // Ref to the `<div>`
		inputRef, // Ref to the `<input>`

	} = useDropzone({
		//getFilesFromEvent: event => myCustomFileGetter(event),
	});
	 */

	const [ipfs, setIpfs] = useState(null as IIPFSFileApi);
	const [disabledUpload, setDisabledUpload] = useState(1);

	const serverList = filterList('API');

	useEffect(() =>
	{

		findIpfsClient([
			...getDefaultServerList()
				.map(url =>
				{
					return url;
				})
			,
//			{
//				url: `https://cors-anywhere.herokuapp.com/https://ipfs.infura.io:5001/api/v0/`,
//			} as any,
			// @ts-ignore
			typeof window !== 'undefined' ? window.ipfs : void 0,
			...serverList,
		], {
			clientArgvs: [],
		})
			.then(ipfs =>
			{
				setIpfs(ipfs);
				setDisabledUpload(0);
			})
		;

	}, []);

	const [ipfsGatewayList, setIpfsGatewayList] = useState([] as string[]);
	const [ipfsGatewayMain, setIpfsGatewayMain] = useState(null as string);

	useEffect(() =>
	{

		(async () => {
			const ipfsGatewayList: string[] = [];

			await ipfsGatewayAddressesLink(ipfs)
				.then(gateway => {
					ipfsGatewayList.push(gateway);

					setIpfsGatewayMain(() => gateway)
				})
				.catch(e => null)
			;

			filterList('Gateway')
				.forEach(gateway => {
					ipfsGatewayList.push(gateway);
				})
			;

			array_unique_overwrite(ipfsGatewayList);

			setIpfsGatewayList(() => ipfsGatewayList)

		})();

	}, [ipfs])

	const style = useMemo(() => ({
		...baseStyle,
		...((isDragActive || isFocused) ? activeStyle : {}),
		...((isDragAccept || isFileDialogActive) ? acceptStyle : {}),
		...(isDragReject ? rejectStyle : {}),
		...(disabledUpload === 2 ? uploadingStyle : {}),
	}), [
		isDragActive,
		isDragAccept,
		disabledUpload,
	]);

	const [lastCid, setLastCid] = useState<string>();

	const [files, setFiles] = useState([] as IFileWithPathWithCid[]);
	const [currentProgress, setCurrentProgress] = useState(0);

	useEffect(() =>
	{
		/**
		 * 正在上傳檔案的時候 不允許新增檔案
		 */
		if (disabledUpload !== 2)
		{
			setFiles(acceptedFiles)
		}
	}, [acceptedFiles]);

	const doUploadCore = async () =>
	{
		let acceptedFiles = files;

		if (acceptedFiles.length && ipfs)
		{
			setDisabledUpload(2);
			setCurrentProgress(0);
			// @ts-ignore
			rootRef.current.noDrag = true;

			const chunkSize = 1024 * 1024 / 4;

			const createStreams = async () => {

				let totalSize = 0;

				const streams = await Bluebird
					.resolve(acceptedFiles)
					.map(async (file: FileWithPath) =>
					{

						totalSize += file.size;

						const ai = async function* (): AsyncGenerator<Buffer, void, unknown>
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

			let { streams, totalSize } = await createStreams();

			const updateProgress = (sent) => {

				let currentProgress = sent / totalSize * 100;
				currentProgress && setCurrentProgress(() => currentProgress);
				console.log(currentProgress)
			}

			await publishToIPFSRace(streams, [
				//...serverList,
				ipfs,
			], {
				addOptions: {
					wrapWithDirectory: true,
					progress: updateProgress,
					// @ts-ignore
					recursive: true,
				},
				timeout: 60 * 60 * 1000,
			})
				.then(async (result) =>
				{

					// @ts-ignore
					let value = result[0].value || result[0].reason.value;

					let i = 0;
					let cid: string;

					for await (const file of value)
					{
						cid = file.cid.toString();

						if (acceptedFiles[i])
						{
							// @ts-ignore
							acceptedFiles[i].cid = cid;
						}

						i++;

						//console.log(cid)
					}

					setLastCid(cid)
					setFiles(acceptedFiles)
				})
		}
	};

	const doUpload = () => doUploadCore()
		.finally(() =>
		{
			setDisabledUpload(0)
		})
	;

	return (
		<section
			className="container"
			style={{
				width: 720,
				maxWidth: '100%',
				padding: 20,
			}}
		>
			<div style={style as any} onClick={() => !disabledUpload && dropzoneRef.current.open()}>
				<input {...getInputProps()} />
				<div style={{
					alignItems: 'center',
					alignContent: 'center',
					textAlign: 'center',
					margin: 10,
				}}>
					{
						(disabledUpload === 2) ?
							<p
								style={{
									color: '#4DA400',
								}}
							>{currentProgress}%</p> :
							<p>將檔案拖放到此處，或單擊以選擇檔案</p>
					}
					<p
						style={{
							color: 'red',
						}}
					>請注意：一旦上傳完成後，您便無法主動刪除檔案</p>
				</div>
			</div>

			<div style={{
				alignItems: 'center',
				alignContent: 'center',
				textAlign: 'center',
				padding: 10,
			}}>
				<button
					style={{
						padding: 5,
						borderRadius: 5,

						backgroundColor: disabledUpload === 2 ? '#ff008c' : disabledUpload === 0 ? '#4DA400' : 'unset',

						color: disabledUpload === 2 ? '#fff' : disabledUpload === 0 ? '#fff' : 'unset',
					}}
					onClick={doUpload}
					disabled={!!disabledUpload}
				>{disabledUpload === 2 ? '上傳中，請稍後...' : disabledUpload === 1 ? '初始化連接 IPFS ...' : '上傳'}
				</button>
			</div>

			<MainCid lastCid={lastCid} ipfsGatewayList={ipfsGatewayList}/>

			<PanelTools/>

			<div>
				<h4>檔案列表</h4>
				<MyFileList
					files={files}
					ipfsGatewayMain={ipfsGatewayMain}
					ipfsGatewayList={ipfsGatewayList}
				/>
			</div>

			<style jsx>{`
			aside { max-width: 300px; }
			`}</style>
		</section>
	);
}
