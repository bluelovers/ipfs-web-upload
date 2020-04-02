import React, { PropsWithChildren, ReactNode, DetailedHTMLProps } from 'react';
import { toLink as toIpfsLink } from 'to-ipfs-url';
import { ipfsServerList } from 'ipfs-server-list';
import ALink from '../ALink';
import ALinkCid, { IALinkCidProps } from './ALinkCid';

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
	lastCid,
	ipfsGatewayList,
}: PropsWithChildren<{
	lastCid: string,
	ipfsGatewayList: string[],
}>) =>
{
	const showCids = () => {
		if (lastCid && ipfsGatewayList.length)
		{
			return <ol>
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
			<p>請注意：如果上傳大約 20 MB 以上檔案的話，如果接收者沒有安裝 IPFS 的話，則需要花費一定程度以上時間伺服器才能找到檔案</p>
			{showCids()}
		</div>
	</>
}
