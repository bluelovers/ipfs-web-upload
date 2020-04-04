import { IFileWithPathWithCid } from '../../component/MyDropzone/MyFileList';

export function getTotalSize(acceptedFiles: IFileWithPathWithCid[])
{
	return acceptedFiles.reduce((totalSize, file) => totalSize += file.size, 0)
}

export default getTotalSize
