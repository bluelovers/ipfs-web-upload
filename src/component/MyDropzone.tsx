import React, { PropsWithChildren, ReactNode, useMemo, useState, useEffect } from 'react';
import Dropzone, { useDropzone, DropEvent, FileWithPath } from 'react-dropzone';
import ipfsClient, { findIpfsClient } from '@bluelovers/ipfs-http-client';
import { filesToStreams } from 'ipfs-browser-util';
import { getDefaultServerList } from '@bluelovers/ipfs-http-client/core';
import { filterList } from 'ipfs-server-list';
import { IIPFSFileApi } from 'ipfs-types/lib/ipfs/file';
import Bluebird from 'bluebird';
import pullStream from 'pull-stream';
import fileReaderStream from 'filereader-stream';
import FileReader from '@tanker/file-reader';
import publishToIPFSRace from 'fetch-ipfs/put';
import { toLink as toIpfsLink, toURL as toIpfsURL } from 'to-ipfs-url';

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
	borderWidth: 2,
	borderRadius: 2,
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

export default (props: PropsWithChildren<{}>) =>
{
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

	const [ipfs, setIpfs] = useState(null as IIPFSFileApi);
	const [disabledUpload, setDisabledUpload] = useState(1);

	useEffect(() =>
	{

		findIpfsClient([
			...getDefaultServerList(),
			...filterList('API'),
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
	}), [
		isDragActive,
		isDragAccept,
		isDragReject,
		isFocused,
		isFileDialogActive,
	]);

	const [lastCid, setLastCid] = useState<string>();

	const updateFiles = (acceptedFiles, cid?) =>
	{

		setLastCid(cid)

		return acceptedFiles.map((file: FileWithPath & {
			cid?: string,
		}) =>
		{
			let url1: URL;
			let url2: URL;

			if (file.cid)
			{
				url1 = toIpfsURL(file.cid)
				url2 = toIpfsURL(file.cid)

				url2.searchParams.set('filename', file.name);
			}

			return (
				<li key={file.path}>
					<div>
						{file.path} - {file.size} bytes
						{file.cid ? <div style={{
							paddingTop: 5,
							paddingBottom: 5,
						}}>
							<a
							style={{
								color: '#4DA400',
							}}
							href={url1.href}
							target="_blank"
						>LINK 1</a>
							<span
								style={{
									marginLeft: 5,
									marginRight: 5,
								}}
							>|</span>
							<a
								style={{
									color: '#4DA400',
								}}
								href={url2.href}
								target="_blank"
							>LINK 2</a>
						</div> : undefined}
					</div>
				</li>
			)
		})
	};

	const [files, setFiles] = useState([]);

	useEffect(() =>
	{
		setFiles(updateFiles(acceptedFiles))
	}, [acceptedFiles]);

	const doUploadCore = async () =>
	{
		if (acceptedFiles.length && ipfs)
		{
			setDisabledUpload(2)

			const streams = await Bluebird
				.resolve(acceptedFiles)
				.map(async (file: FileWithPath) =>
				{
					const ai = async function* ()
					{
						const reader = new FileReader(file);
						const chunkSize = 8;
						let chunk;
						do
						{
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

			await publishToIPFSRace(streams, [
				ipfs,
				...filterList('API'),
			], {
				addOptions: {
					wrapWithDirectory: true,
				},
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

						console.log(cid)
					}

					setFiles(updateFiles(acceptedFiles, cid))
				})
		}
	};

	const doUpload = () => doUploadCore()
		.finally(() => {
			setDisabledUpload(0)
		})
	;

	return (
		<section className="container">
			<div {...getRootProps({
				// @ts-ignore
				style,
			})}>
				<input {...getInputProps()} />
				<div style={{
					alignItems: 'center',
					alignContent: 'center',
					textAlign: 'center',
					margin: 10,
				}}>
					{
					(0 && isDragActive) ?
						<p>Drop the files here ...</p> :
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

			<aside>
				{lastCid ? <a
					style={{
						padding: 5,
						color: '#ff008c',
					}}
					href={toIpfsLink(lastCid)}
					target="_blank"
				>{toIpfsLink(lastCid)}</a> : undefined}
			</aside>

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
