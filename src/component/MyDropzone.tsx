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

async function myCustomFileGetter(event: DropEvent)
{
	const files: FileWithPath[] = [];
	// @ts-ignore
	const fileList: FileList = event.dataTransfer ? event.dataTransfer.files : event.target.files;

	const len = fileList.length;

	for (let i = 0; i < len; i++)
	{
		const file = fileList.item(i);
		files.push(file);
	}

	return files;
}

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

	const updateFiles = (acceptedFiles, cid?) =>
	{

		setLastCid(cid)

		return acceptedFiles.map((file: FileWithPath & {
			cid?: string,
		}) =>
		{

			const urls: string[] = [];

			if (file.cid)
			{
				let url1: URL;
				let url2: URL;

				url1 = toIpfsURL(file.cid)
				url2 = toIpfsURL(file.cid)

				url1.searchParams.set('filename', file.name);

				urls.push(url1.href);
				urls.push(url2.href);

				urls.push(toIpfsURL(file.cid, {
					prefix: {
						ipfs: ipfsServerList.ipfs.Gateway,
					},
				}).href);

				urls.push(toIpfsURL(file.cid, {
					prefix: {
						ipfs: ipfsServerList['infura.io'].Gateway,
					},
				}).href);

				urls.push(toIpfsURL(file.cid, {
					prefix: {
						ipfs: ipfsServerList.cloudflare.Gateway,
					},
				}).href);

				array_unique_overwrite(urls)
			}

			return (
				<li
					key={file.path}
					style={{
						marginBottom: 5,
					}}
				>
					<div>
						<span
							style={{
								wordBreak: 'break-all',
								wordWrap: 'break-word',
							}}
						>{file.path}</span> - {file.size} bytes
						{file.cid ? <div style={{
							paddingTop: 5,
							paddingBottom: 5,
						}}>
							{
								(urls.length ? urls.map((url, i) =>
								{
									return (<span key={url}>
									{i ? (<span
											style={{
												marginLeft: 5,
												marginRight: 5,
											}}
										>|</span>) : undefined}
										<a
											style={{
												color: '#4DA400',
											}}
											href={url}
											target="_blank"
										>LINK {1 + i}</a>
									</span>)
								}) : undefined)
							}

						</div> : undefined}
					</div>
				</li>
			)
		})
	};

	const [files, setFiles] = useState([]);
	const [currentProgress, setCurrentProgress] = useState(0);

	useEffect(() =>
	{
		setFiles(updateFiles(acceptedFiles))
	}, [acceptedFiles]);

	const doUploadCore = async () =>
	{
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

					setFiles(updateFiles(acceptedFiles, cid))
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
		<section className="container">
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

			<div
				style={{
					padding: 10,
					color: '#ff008c',

					borderWidth: 2,
					borderRadius: 2,
					borderColor: '#ff008c',
					borderStyle: 'dashed',

					wordBreak: 'break-all',
					wordWrap: 'break-word',
				}}
			>
				{lastCid ? (<>

					<p><a
					style={{
						color: '#ff008c',

						wordBreak: 'break-all',
						wordWrap: 'break-word',
					}}
					href={toIpfsLink(lastCid)}
					target="_blank"
					>{toIpfsLink(lastCid)}</a></p>

					<p><a
						style={{
							color: '#ff008c',

							wordBreak: 'break-all',
							wordWrap: 'break-word',
						}}
						href={toIpfsLink(lastCid, {
							prefix: {
								ipfs: ipfsServerList['infura.io'].Gateway,
							},
						})}
						target="_blank"
					>{toIpfsLink(lastCid, {
						prefix: {
							ipfs: ipfsServerList['infura.io'].Gateway,
						},
					})}</a></p>

					<p><a
						style={{
							color: '#ff008c',

							wordBreak: 'break-all',
							wordWrap: 'break-word',
						}}
						href={toIpfsLink(lastCid, {
							prefix: {
								ipfs: ipfsServerList.cloudflare.Gateway,
							},
						})}
						target="_blank"
					>{toIpfsLink(lastCid, {
						prefix: {
							ipfs: ipfsServerList.cloudflare.Gateway,
						},
					})}</a></p>

				</>) : undefined}
			</div>

			<div>
				<p>安裝以下工具 可加速上傳/下載</p>
				<p><a style={{
					color: '#70b1e6',
				}} href={'https://github.com/ipfs-shipyard/ipfs-desktop'} target="_blank">IPFS Desktop</a> - 備用載點 <a style={{
					color: '#70b1e6',
				}} href={'https://ipfs.io/ipfs/QmNdkGvnFv84NMkQQzJiT9cdkVhdE6iBMyaajFjPUe2rU2?filename=IPFS-Desktop-Setup-0.10.4.exe'} target="_blank">windows</a></p>
				<p><a style={{
					color: '#70b1e6',
				}} href={'https://github.com/ipfs-shipyard/ipfs-companion#ipfs-companion'} target="_blank">IPFS Companion</a></p>
			</div>

			<aside>
				<h4>檔案列表</h4>
				<ul>{files}</ul>
			</aside>
			<style jsx>{`
			aside { max-width: 300px; }
			`}</style>
		</section>
	);
}
