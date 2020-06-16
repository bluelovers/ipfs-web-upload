function chain(ls, nextConfig)
{
	return ls.reduce((nextConfig, fn) =>
	{
		return fn(nextConfig)
	}, nextConfig)
}

module.exports = chain([



], {

	assetPrefix: '.',

	typescript: {
		//ignoreDevErrors: true,
		ignoreBuildErrors: true,
	},

});
