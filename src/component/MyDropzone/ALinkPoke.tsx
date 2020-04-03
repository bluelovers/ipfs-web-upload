import React, { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import ALink, { IALinkProps } from '../ALink';
import { pokeURL } from 'poke-ipfs';

export default ({
	href,
	children,
	...prop
}: IALinkProps) =>
{
	const [check, setCheck] = useState(null as string);

	useEffect(() =>
	{

		pokeURL(href, {
			cors: true,
		})
			.then(ret =>
			{

				if (ret.value)
				{
					setCheck('my_ipfs_check_true')
				}
				else if (ret.value == null)
				{
					setCheck('my_ipfs_check_unknown')
					console.warn(ret, href)
				}
				else
				{
					setCheck('my_ipfs_check_false')
					console.warn(ret, href)
				}

			})
			.catch(e => null)
		;

	}, [href])

	return <>
		<span className={`my_ipfs_check ${check}`} />
		<ALink href={href} {...prop}>
			{children ?? href}
		</ALink>
		<style jsx global>{`
.my_ipfs_check {
margin-left: 5px;
margin-right: 5px;
min-width: 2em;
}
.my_ipfs_check:after {
content: '　';
}
.my_ipfs_check_true:after {
content: '✔';
color: #FF7123;
}
.my_ipfs_check_false:after {
content: '✘';
color: #E30000;
}
.my_ipfs_check_unknown:after {
content: '∾';
color: #80929d;
}
		`}</style>
	</>
}

