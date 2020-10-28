import React, { PropsWithChildren } from 'react';
import ALinkCid, { IALinkCidProps } from './ALinkCid';
import { IFileWithPathWithCid } from './MyFileList';
import styles from './MainCid.module.scss';
import { EnumCurrentAppState } from '../../lib/const';
import ALink from '../ALink';
import ALinkPoke from './ALinkPoke';
import ipfsProtocol from '@lazy-ipfs/ipfs-protocol';
import { filterList } from 'ipfs-server-list';
import ipfsSubdomain from '@lazy-ipfs/ipfs-subdomain';

const ALinkCidMain = ({
	cid,
	gateway,
	children,
	index,
	...prop
}: IALinkCidProps & {
	index: number,
}) => {
	return (<ALinkCid
		style={{
			color: index > 3 ? '#e600ff' : '#ff008c',
			wordBreak: 'break-all',
			wordWrap: 'break-word',
		}}
		cid={cid}
		gateway={gateway}
		key={gateway}
		title={gateway}
		{...prop}
	>
		{children}
	</ALinkCid>)
}

export default ({
	files,
	lastCid,
	ipfsGatewayList,
	currentAppState,
}: PropsWithChildren<{
	lastCid: string,
	ipfsGatewayList: string[],
	currentAppState: EnumCurrentAppState,
	files: IFileWithPathWithCid[],
}>) =>
{
	const showCids = () => {
		if (lastCid && ipfsGatewayList.length)
		{
			const ipfs_url = ipfsProtocol(lastCid);

			const ipfs_share_url = `https://share.ipfs.io/#/${lastCid}`;

			return <ol>
				<li>
					<ALinkPoke
						href={ipfs_url}
						style={{
							color: '#6acad1',
							wordBreak: 'break-all',
							wordWrap: 'break-word',
						}}
						title={`此連結需要環境支援才能開啟`}
					>
						{ipfs_url}
					</ALinkPoke>
				</li>
				<li>
					<ALinkPoke
						href={ipfs_share_url}
						style={{
							color: '#6acad1',
							wordBreak: 'break-all',
							wordWrap: 'break-word',
						}}
						title={`share.ipfs.io`}
					>
						{ipfs_share_url}
					</ALinkPoke>
				</li>
				{ipfsGatewayList.map((gateway, index) => {
					return (<li
						style={{
							marginBottom: 5,
						}}
						key={index}
					>
						<ALinkCidMain
							cid={lastCid}
							gateway={gateway}
							index={index}
							key={index}
						></ALinkCidMain>
					</li>)
				})}
				{filterList('GatewayDomain').map((gateway, index) => {
					return (<li
						style={{
							marginBottom: 5,
						}}
						key={index}
					>
						<ALinkPoke
							style={{
								color: index > 3 ? '#e600ff' : '#ff008c',
								wordBreak: 'break-all',
								wordWrap: 'break-word',
							}}
							key={index}
							href={ipfsSubdomain(lastCid, gateway)}
						></ALinkPoke>
					</li>)
				})}
			</ol>
		}
	}

	return <>
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
			<div className={styles.main_cid_inner}>
			<p>請注意：當上傳大約 20 MB 以上檔案時，如果接收者沒有安裝 IPFS 的話，則需要花費一定程度以上時間伺服器才能找到檔案</p>
			{currentAppState === EnumCurrentAppState.FAIL ? (<>

				<p style={{
					textAlign: 'center',
					padding: 10,
				}}>上傳失敗（ {files.filter(file => file.cid).length} ／ {files.length} ）</p>

			</>) : showCids()}
			</div>
		</div>
	</>
}
