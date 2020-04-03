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
import { ipfsApiAddresses } from 'ipfs-util-lib';
import MainCid from './MyDropzone/MainCid';
import MyFileList, { IFileWithPathWithCid } from './MyDropzone/MyFileList';
import PanelTools from './PanelTools';
import uploadToIPFS, { createStreams } from '../lib/MyDropzone/uploadToIPFS';
import styles from './MyDropzone.module.scss';
import console from '../lib/console2';
import getIpfsGatewayList from '../lib/getIpfsGatewayList';

export enum EnumCurrentAppState
{
	INIT = 0,
	READY = 1,
	UPLOADING = 2,
	FAIL = 3,
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
	const [currentAppState, setCurrentAppState] = useState<EnumCurrentAppState>(EnumCurrentAppState.INIT);
	const [ipfsServer, setIpfsServer] = useState<string>();

	const serverList: IIPFSAddressesLike['API'][] = filterList('API');

	useEffect(() =>
	{

		console.info(`搜尋可用的 IPFS API 伺服器...`);

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
				console.info(`成功連接 IPFS API 伺服器`);

				setIpfs(ipfs);
				setCurrentAppState(EnumCurrentAppState.READY);

				return ipfsApiAddresses(ipfs)
					.then(addresses => setIpfsServer(() => addresses))
					.catch(e => console.error(`沒有權限取得 IPFS 伺服器位址`, ipfs, e))
			})
		;

	}, []);

	const [ipfsGatewayList, setIpfsGatewayList] = useState([] as string[]);
	const [ipfsGatewayMain, setIpfsGatewayMain] = useState(null as string);

	useEffect(() =>
	{

		getIpfsGatewayList(ipfs)
			.then(({
				ipfsGatewayMain,
				ipfsGatewayList,
			}) => {

				ipfsGatewayMain && setIpfsGatewayMain(() => ipfsGatewayMain);
				setIpfsGatewayList(() => ipfsGatewayList);

			})
		;

	}, [ipfs])

	const style = useMemo(() => ({
		...baseStyle,
		...((isDragActive || isFocused) ? activeStyle : {}),
		...((isDragAccept || isFileDialogActive) ? acceptStyle : {}),
		...(isDragReject ? rejectStyle : {}),
		...(currentAppState === EnumCurrentAppState.UPLOADING ? uploadingStyle : {}),
	}), [
		isDragActive,
		isDragAccept,
		currentAppState,
	]);

	const [lastCid, setLastCid] = useState<string>();

	const [files, setFiles] = useState([] as IFileWithPathWithCid[]);
	const [currentProgress, setCurrentProgress] = useState(0);

	const chunkSize = 1024 * 1024 / 3;

	useEffect(() =>
	{
		/**
		 * 正在上傳檔案的時候 不允許新增檔案
		 */
		if (currentAppState !== EnumCurrentAppState.UPLOADING)
		{
			setFiles(acceptedFiles)
		}
	}, [acceptedFiles]);

	const updateProgress = (sent: number, totalSize: number) => {
		let c = sent / totalSize * 100;
		setCurrentProgress(c);
		console.info(`[CurrentProgress]`, c)
	}

	const doUploadCore = async () =>
	{
		let acceptedFiles = files;

		console.info(`即將開始上傳檔案`, acceptedFiles)

		if (acceptedFiles.length && ipfs)
		{
			setCurrentAppState(EnumCurrentAppState.UPLOADING);
			setCurrentProgress(0);
			setLastCid(void 0);

			const totalFiles = acceptedFiles.length;

			return uploadToIPFS({
				ipfs,
				updateProgress,

				serverList,

				acceptedFiles,
				chunkSize,
			})
				.then(async (result) =>
				{
					if (!result || !result?.length)
					{
						return Promise.reject(result)
					}

					// @ts-ignore
					let value = result[0].value || result[0].reason.value;

					let i = 0;
					let cid: string;
					let firstCid: string;

					for await (const file of value)
					{
						cid = file.cid.toString();

						if (firstCid === void 0)
						{
							firstCid = cid;
						}

						if (acceptedFiles[i])
						{
							// @ts-ignore
							acceptedFiles[i].cid = cid;
						}

						i++;

						//console.log(cid)
					}

//					console.dir({
//						firstCid,
//						cid,
//						i,
//						totalFiles,
//						length: value.length,
//					})

					if (firstCid === cid || !cid || i <= totalFiles)
					{
						setCurrentAppState(EnumCurrentAppState.FAIL)
					}
					else
					{
						setLastCid(cid)
						setCurrentAppState(EnumCurrentAppState.READY)
					}

					setFiles(acceptedFiles)
				})
			;
		}
	};

	const doUpload = () => doUploadCore()
		.catch(e => console.error(`[doUpload]`, e))
		.finally(() =>
		{

			setCurrentAppState((currentAppState) => {

				if (currentAppState !== EnumCurrentAppState.FAIL)
				{
					return EnumCurrentAppState.READY
				}

				return currentAppState
			})
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
			<div style={style as any} onClick={() => currentAppState === EnumCurrentAppState.READY && dropzoneRef.current.open()}>
				<input {...getInputProps()} />
				<div style={{
					alignItems: 'center',
					alignContent: 'center',
					textAlign: 'center',
					margin: 10,
				}}>
					{
						(currentAppState === EnumCurrentAppState.UPLOADING) ?
							<p
								style={{
									color: '#4DA400',
								}}
							>{currentProgress}%</p> :
							<p>將檔案拖放到此處，或單擊以選擇檔案</p>
					}
					{
						files.length ? (<p>總計 {files.length} 個檔案</p>) : undefined
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

						backgroundColor: currentAppState === EnumCurrentAppState.UPLOADING ? '#ff008c' : currentAppState === EnumCurrentAppState.READY ? '#4DA400' : 'unset',

						color: currentAppState === EnumCurrentAppState.UPLOADING ? '#fff' : currentAppState === EnumCurrentAppState.READY ? '#fff' : 'unset',
					}}
					onClick={doUpload}
					disabled={currentAppState !== EnumCurrentAppState.READY}
				>
					{currentAppState === EnumCurrentAppState.UPLOADING ? '上傳中，請稍後... ' : currentAppState === EnumCurrentAppState.INIT ? '初始化連接 IPFS ... ' : `上傳至 `}
					{ipfsServer || 'Unknown IPFS Server'}
				</button>
			</div>

			<MainCid lastCid={lastCid} ipfsGatewayList={ipfsGatewayList} currentAppState={currentAppState} files={files} />

			<PanelTools/>

			<div>
				<h4>檔案列表</h4>
				<p>在網址後方加上<code className={styles.code}>?filename=檔案名稱.epub</code>的話，當觸發檔案下載時就會將檔案儲存成你所設定的檔名</p>
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
