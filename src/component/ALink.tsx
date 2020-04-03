import React, { HTMLProps, ReactNode, DetailedHTMLProps } from 'react';

export interface IALinkProps extends DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>
{
	href: string,
	target?: string,
}

export default ({
	href,
	target = '_blank',
	children,
	...prop
}: IALinkProps) =>
{
	return (<a
		href={href}
		target={target}
		title={href}
		{...prop}
	>{children ?? href}</a>)
}
