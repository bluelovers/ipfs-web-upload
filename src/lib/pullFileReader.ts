import toBuffer from 'typedarray-to-buffer';

function pullFileReader(file: File, opts?: {
	offset?: number,
	/**
	 * default 1MB chunk has tolerable perf on large files
	 */
	chunkSize?: number,
})
{
	let offset = opts?.offset || 0;
	const chunkSize = opts?.chunkSize || 1024 * 1024;

	return function <END, R>(end: END, cb: ((err: ProgressEvent<FileReader> | boolean | END, data?: ArrayBuffer) => R))
	{
		if (end) return cb(end)
		// If finished reading then stop
		if (offset >= file.size) return cb(true)

		// @ts-ignore
		const fileReader = new FileReader(file);

		fileReader.onloadend = function loaded(event)
		{
			let data = event.target.result as ArrayBuffer;

			if (data instanceof ArrayBuffer)
			{
				data = toBuffer(new Uint8Array(event.target.result as any))
			}

			cb(null, data)
		}

		fileReader.onerror = function (err)
		{
			cb(err)
		}

		const endIndex = offset + chunkSize;
		const slice = file.slice(offset, endIndex);
		fileReader.readAsArrayBuffer(slice)
		offset = endIndex
	}
}
