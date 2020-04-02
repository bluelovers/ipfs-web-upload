import React, { PropsWithChildren, ReactNode } from 'react';
import { FileWithPath } from 'react-dropzone';
import prettyBytes from 'pretty-bytes';
import { toURL as toIpfsURL } from 'to-ipfs-url';
import { array_unique_overwrite } from 'array-hyper-unique';
import ALink from '../ALink';

export interface IFileWithPathWithCid extends FileWithPath
{
	cid?: string,
}

const MyFile = ({
	file,
	ipfsGatewayMain,
	ipfsGatewayList,
	...props
}: PropsWithChildren<{
	file: IFileWithPathWithCid,
	ipfsGatewayMain: string,
	ipfsGatewayList: string[],
}>) =>
{
	const urls: URL[] = [];

	if (file.cid)
	{
		let url1: URL;

		if (ipfsGatewayMain)
		{
			url1 = toIpfsURL(file.cid, {
				prefix: {
					ipfs: ipfsGatewayMain,
				},
			})
		}
		else
		{
			url1 = toIpfsURL(file.cid)
		}

		urls.push(url1);

		url1.searchParams.set('filename', file.name);

		urls.unshift(new URL(url1.href));

		ipfsGatewayList
			.forEach(ipfs =>
			{
				urls.push(toIpfsURL(file.cid, {
					prefix: {
						ipfs,
					},
				}));
			})
		;

		array_unique_overwrite(urls);
	}

	return <li
		style={{
			marginBottom: 5,
		}}
		{...props}
	>
		<div>
			<span
				style={{
					wordBreak: 'break-all',
					wordWrap: 'break-word',
				}}
			>{file.path}</span> - <span>{prettyBytes(file.size)}</span>
			{
				file.cid && (
					<div style={{
						paddingTop: 5,
						paddingBottom: 5,
					}}>
						{urls.map((url, i) =>
						{
							return (<span
								key={url.href}
							>
								{i && (<span
									style={{
										marginLeft: 5,
										marginRight: 5,
									}}
								>|</span>) || null}
								<ALink
									style={{
										color: i > 4 ? '#00a483' : '#4DA400',
									}}
									href={url.href}
									title={url.hostname}
								>LINK {1 + i}</ALink>
							</span>)
						})}
					</div>
				)
			}
		</div>
	</li>
}

export default ({
	files,
	ipfsGatewayMain,
	ipfsGatewayList,
	...props
}: PropsWithChildren<{
	files: IFileWithPathWithCid[],
	ipfsGatewayMain: string,
	ipfsGatewayList: string[],
}>) =>
{
	return (<ul {...props}>
		{files.map(file => (<MyFile
			file={file}
			ipfsGatewayMain={ipfsGatewayMain}
			ipfsGatewayList={ipfsGatewayList}
			key={file.path}
		/>))}
	</ul>)
}
