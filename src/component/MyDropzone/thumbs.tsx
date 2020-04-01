import React, { useEffect, useState, PropsWithChildren } from 'react';
import { useDropzone } from 'react-dropzone';

const thumbsContainer = {
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	marginTop: 16,
};

const thumb = {
	display: 'inline-flex',
	borderRadius: 2,
	border: '1px solid #eaeaea',
	marginBottom: 8,
	marginRight: 8,
	width: 100,
	height: 100,
	padding: 4,
	boxSizing: 'border-box',
};

const thumbInner = {
	display: 'flex',
	minWidth: 0,
	overflow: 'hidden',
};

const img = {
	display: 'block',
	width: 'auto',
	height: '100%',
};

export default (props: PropsWithChildren<{
	files: any[],
}>) => {

	const thumbs = props.files.map(file => (
		//@ts-ignore
		<div style={thumb} key={file.name}>
			<div style={thumbInner}>
				<img
					src={file.preview}
					style={img}
				/>
			</div>
		</div>
	));

	//@ts-ignore
	return (<aside style={thumbsContainer}>
		{thumbs}
	</aside>)
}
