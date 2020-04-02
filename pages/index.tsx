import Head from 'next/head'
import MyDropzone from '../src/component/MyDropzone';
import React, { createRef } from 'react';
import Dropzone, { useDropzone, DropEvent, FileWithPath, DropzoneState, DropzoneRef } from 'react-dropzone';
import ALink from '../src/component/ALink';

const Home = () =>
{
	const dropzoneRef = createRef<DropzoneRef>()

	return (
		<div className="container">
			<Head>
				<title>IPFS Uploader</title>
				<link rel="icon" href="./favicon.ico" />
			</Head>

			<Dropzone ref={dropzoneRef} noClick>
				{(propDropzoneState) => (
					<main
						className="dropzoneBody"
						style={{
							width: '100%',
							maxWidth: '100%',
						}}
						{...propDropzoneState.getRootProps()}
					>

						<img
							src="https://ipfs.io/ipfs/QmdPAhQRxrDKqkGPvQzBvjYe3kU8kiEEAd2J6ETEamKAD9"
							alt="IPFS Logo"
							width="720"
							style={{
								maxWidth: '100%',
								display: 'block',
							}}
						/>

						<h1
							className="title"
							style={{
								color: '#6acad1',
							}}
						>
							<ALink
								href={'https://ipfs-web-upload.now.sh/'}
								title={'IPFS Uploader'}
								target={'_self'}
							>IPFS Uploader</ALink>
						</h1>

						<p className="description">
							無需註冊免費將您的檔案上傳至 IPFS 網路
						</p>

						<MyDropzone {...propDropzoneState} dropzoneRef={dropzoneRef} />

					</main>
				)}
			</Dropzone>

			<footer>
					Powered by&nbsp;<ALink
				href="https://github.com/bluelovers/ipfs-web-upload"
				rel="noopener noreferrer"
			>
				<b>ipfs-web-upload</b>
			</ALink>
			</footer>

			<style jsx>{`
		
		.ipfs_logo
		{
		filter: invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
		}
		
      .container {
        min-height: 100vh;
        padding: 0 0.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      main {
        padding: 5rem 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      footer {
        width: 100%;
        height: 100px;
        border-top: 1px solid #eaeaea;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      footer img {
        margin-left: 0.5rem;
      }

      footer a {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .title a {
        color: #0070f3;
        text-decoration: none;
      }

      .title a:hover,
      .title a:focus,
      .title a:active {
        text-decoration: underline;
      }

      .title {
        margin: 0;
        line-height: 1.15;
        font-size: 4rem;
      }

      .title,
      .description {
        text-align: center;
      }

      .description {
        line-height: 1.5;
        font-size: 1.5rem;
      }

      code {
        background: #fafafa;
        border-radius: 5px;
        padding: 0.75rem;
        font-size: 1.1rem;
        font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
          DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
      }

      .grid {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;

        max-width: 800px;
        margin-top: 3rem;
      }

      .card {
        margin: 1rem;
        flex-basis: 45%;
        padding: 1.5rem;
        text-align: left;
        color: inherit;
        text-decoration: none;
        border: 1px solid #eaeaea;
        border-radius: 10px;
        transition: color 0.15s ease, border-color 0.15s ease;
      }

      .card:hover,
      .card:focus,
      .card:active {
        color: #0070f3;
        border-color: #0070f3;
      }

      .card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }

      .card p {
        margin: 0;
        font-size: 1.25rem;
        line-height: 1.5;
      }

      @media (max-width: 600px) {
        .grid {
          width: 100%;
          flex-direction: column;
        }
      }
      
      .dropzoneBody:focus
      {
      outline: transparent auto 0px;
      }
    `}</style>

			<style jsx global>{`
      html,
      body, :root {
      background-color: #23272b;
      color: #bbb;
      
        padding: 0;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
          Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
      }

      * {
        box-sizing: border-box;
      }
      
      a {
        color: inherit;
        text-decoration: none;
      }
    `}</style>
		</div>
	)
}

export default Home
