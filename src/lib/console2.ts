/**
 * Created by user on 2020/4/3.
 */

import _consola, { Consola } from 'consola';

export const console2 = Object.entries(console)
	.reduce((_consola, [name, value]) => {

		if (!(name in _consola) && _consola[name] === void 0)
		{
			if (typeof value === 'function')
			{
				Object.defineProperty(_consola, name, {
					value: console[name].bind(console)
				})
			}
			else
			{
				Object.defineProperty(_consola, name, {
					get()
					{
						return console[name]
					}
				})
			}
		}

		return _consola;
	}, _consola as Omit<typeof console, keyof Consola> & Consola)

export default console2
