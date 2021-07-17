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
			href={'https://share.ipfs.io/#/QmbEsbTArGAS1DHxrdCvZMGumP7DSwuxCauuytpDDGarMR'}
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
		<p><ALink
			style={{
				color: '#70b1e6',
			}}
			href={'https://brave.com/zh/'}
			target="_blank"
		>Brave 瀏覽器</ALink></p>
		<p><ALink
			style={{
				color: '#70b1e6',
			}}
			href={'https://play.google.com/store/apps/details?id=com.opera.browser'}
			target="_blank"
		>Opera 瀏覽器 Android</ALink></p>
	</div>)
}
