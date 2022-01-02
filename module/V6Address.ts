import { Address } from './Address.ts';

export class V6Address extends Address
{
	constructor({ bytes, subnetSize = 128 }: { bytes: number[], subnetSize?: number; })
	{
		super({ bytes, subnetSize: subnetSize ?? 128 });

		if(this.subnetSize < 0 || this.subnetSize > this.size)
			throw new Error(`Invalid subnet size ${subnetSize} for an IPv6 address`);
		if(this.bytes.length !== this.size / 8)
			throw new Error(`Invalid number of bytes (${this.bytes.length}) for an IPv6 address`);
	}

	get addressType(): number
	{
		return 6;
	}
	get size(): number
	{
		return 128;
	}
	get blocks(): number[]
	{
		const blocks: number[] = [];
		for(let i = 0; i < this.bytes.length; ++i)
		{
			if(i % 2 === 0)
				blocks.push(0);

			const byte = this.bytes[i];
			blocks[blocks.length - 1] = (blocks[blocks.length - 1] << 8) | byte;
		}

		return blocks;
	}
	get biggestVoid(): { start: number, size: number; }
	{
		const blocks = this.blocks;
		let biggestVoidStart = -1;
		let biggestVoidSize = 0;
		let currentVoidStart = -1;
		let currentVoidSize = 0;

		for(let i = 0; i < blocks.length; ++i)
		{
			if(blocks[i] !== 0)
			{
				currentVoidSize = 0;
				currentVoidStart = -1;
				continue;
			}

			if(currentVoidStart < 0)
				currentVoidStart = i;
			++currentVoidSize;

			if(currentVoidSize > biggestVoidSize)
			{
				biggestVoidSize = currentVoidSize;
				biggestVoidStart = currentVoidStart;
			}
		}

		return { start: biggestVoidStart, size: biggestVoidSize };
	}


	covers(address: V6Address | string): boolean
	{
		const addressObj = typeof (address) == 'object' ? address : V6Address.fromString(address);
		if(!addressObj)
			return false;

		return this._covers(addressObj);
	}
	toString({ appendCIDR = undefined, uncompressed = false }: { appendCIDR?: boolean | undefined, uncompressed?: boolean; } = {}): string
	{
		if(uncompressed)
			return this.toUncompressedString(...arguments);

		const biggestVoid = this.biggestVoid || { start: -1, size: 0 };
		const blocks = this.blocks
			.map((byte, idx) => idx === biggestVoid.start ? '' : byte)
			.filter((_, idx) => idx <= biggestVoid.start || idx >= biggestVoid.start + biggestVoid.size);

		if(biggestVoid.start === 0)
			blocks.splice(0, 0, '');
		if(biggestVoid.start + biggestVoid.size === 8)
			blocks.push('');


		let str = blocks.map((byte) => byte.toString(16)).join(':');
		if(appendCIDR === true || (appendCIDR === undefined && this.subnetSize !== this.size))
			str += '/' + this.subnetSize;

		return str;
	}
	toUncompressedString({ appendCIDR = undefined }: { appendCIDR?: boolean | undefined; } = {}): string
	{
		let str = this.blocks.map((byte) => byte.toString(16).padStart(4, '0')).join(':');
		if(appendCIDR === true || (appendCIDR === undefined && this.subnetSize !== this.size))
			str += '/' + this.subnetSize;

		return str;
	}
	[Symbol.toPrimitive](): string
	{
		return this.toString();
	}

	clone(): V6Address
	{
		return new V6Address({ bytes: this.bytes.slice(), subnetSize: this.subnetSize });
	}


	static fromString(str: string): V6Address | undefined
	{
		if(!str || typeof (str) !== 'string')
			return undefined;

		let [, addressStr, , subnetStr] = str.match(/^([^\/]+)(\/(\d+))?$/) || [];
		if(!addressStr)
			return undefined;


		if(addressStr.startsWith('::'))
			addressStr = '0' + addressStr;
		if(addressStr.endsWith('::'))
			addressStr = addressStr + '0';

		const parts = addressStr
			.split(':')
			.map((strPart) => strPart === '' ? -1 : Number('0x' + strPart));
		if(parts.length > 8)
			return undefined;
		if(parts.filter((part) => part === -1).length > 1)
			return undefined;
		if(parts.some((part) => !Number.isInteger(part) || part < -1 || part > 0xffff))
			return undefined;

		const voidIdx = parts.indexOf(-1);
		if(voidIdx !== -1)
		{
			const voidSize = 8 - parts.length + 1;
			const voidContent = new Array(voidSize).fill(0);
			parts.splice(voidIdx, 1, ...voidContent);
		}
		if(parts.length !== 8)
			return undefined;


		const bytes = ([] as number[]).concat(...parts.map((part) => [part >> 8, part & 0xff]));

		let subnetSize = 128;
		if(subnetStr)
		{
			subnetSize = Number(subnetStr);
			if(!Number.isInteger(subnetSize) || subnetSize < 0 || subnetSize > 128)
				return undefined;
		}


		const address = new V6Address({ bytes, subnetSize });

		return address;
	}
	static fromBigInt(bigInt: bigint, subnetSize?: number): V6Address | undefined
	{
		if(bigInt > 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn || bigInt < 0n)
			return undefined;


		const bytes = Array(16);
		for(let i = 15; i >= 0; --i)
		{
			bytes[i] = Number(bigInt & 0xFFn);
			bigInt >>= 8n;
		}

		return new V6Address({ bytes, subnetSize });
	}
}
