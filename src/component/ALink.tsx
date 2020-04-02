import React, { HTMLProps, ReactNode, DetailedHTMLProps } from 'react';

export default ({
	href,
	target = '_blank',
	children,
	...prop
}: DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {
	href: string,
	target?: string,
}) =>
{
	return (<a
		href={href}
		target={target}
		title={href}
		{...prop}
	>{children ?? href}</a>)
}
