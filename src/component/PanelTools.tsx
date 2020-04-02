import React, { PropsWithChildren, ReactNode } from 'react';
import ALink from './ALink';

export default (prop: PropsWithChildren<{}>) =>
{
	return (<div {...prop}>
		<p>安裝以下工具 可加速上傳/下載</p>
		<p>因伺服器限制與網頁限制部分檔案需要透過安裝 IPFS 才能上傳成功</p>
		<p><ALink
			style={{
				color: '#70b1e6',
			}}
			href={'https://github.com/ipfs-shipyard/ipfs-desktop'}
			target="_blank"
		>IPFS Desktop</ALink> - 備用載點 <ALink
			style={{
				color: '#70b1e6',
			}}
			href={'https://ipfs.io/ipfs/QmNdkGvnFv84NMkQQzJiT9cdkVhdE6iBMyaajFjPUe2rU2?filename=IPFS-Desktop-Setup-0.10.4.exe'}
			target="_blank"
		>windows</ALink>
		</p>
		<p><ALink
			style={{
				color: '#70b1e6',
			}}
			href={'https://github.com/ipfs-shipyard/ipfs-companion#ipfs-companion'}
			target="_blank"
		>IPFS Companion</ALink></p>
	</div>)
}
