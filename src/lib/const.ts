/**
 * Created by user on 2020/4/4.
 */

export const chunkSize = 1024 * 1024 / 3;

export enum EnumCurrentAppState
{
	/**
	 * 等待初始化
	 */
	INIT = 0,
	READY = 1,
	/**
	 * 上傳中
	 */
	UPLOADING = 2,
	/**
	 * 上傳失敗
	 */
	FAIL = 3,
}
