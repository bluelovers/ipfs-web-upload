import React, { PropsWithChildren, ReactNode, DetailedHTMLProps } from 'react';
import { toLink as toIpfsLink } from 'to-ipfs-url';
import ALink from '../ALink';
import ALinkPoke from './ALinkPoke';

export interface IALinkCidProps extends DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
{
	cid: string,
	gateway: string,
	href?: never,
}

export default ({
	cid,
	gateway,
	children,
	...prop
}: IALinkCidProps) =>
{
	let href = toIpfsLink(cid, {
		prefix: {
			ipfs: gateway,
		},
	});

	return (<ALinkPoke
		{...prop}
		href={href}
	>
		{children}
	</ALinkPoke>)
}
