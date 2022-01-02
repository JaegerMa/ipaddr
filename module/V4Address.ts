import { Address } from './Address.ts';

export class V4Address extends Address
{
	constructor({ bytes, subnetSize = 32 }: { bytes: number[], subnetSize?: number; })
	{
		super({ bytes, subnetSize: subnetSize ?? 32 });

		if(this.subnetSize < 0 || this.subnetSize > this.size)
			throw new Error(`Invalid subnet size ${subnetSize} for an IPv4 address`);
		if(this.bytes.length !== this.size / 8)
			throw new Error(`Invalid number of bytes (${this.bytes.length}) for an IPv5 address`);
	}

	get addressType(): number
	{
		return 4;
	}
	get size(): number
	{
		return 32;
	}

	covers(address: V4Address | string): boolean
	{
		const addressObj = typeof (address) == 'object' ? address : V4Address.fromString(address);
		if(!addressObj)
			return false;

		return this._covers(addressObj);
	}
	toInt(): number
	{
		let n = 0;
		for(let i = 0; i < this.bytes.length; ++i)
			n = (n << 8) | this.bytes[i];

		return n;
	}
	toString({ appendCIDR = undefined }: { appendCIDR?: boolean | undefined; } = {}): string
	{
		let str = this.bytes.map((byte) => byte.toString()).join('.');
		if(appendCIDR === true || (appendCIDR === undefined && this.subnetSize !== this.size))
			str += '/' + this.subnetSize;

		return str;
	}
	[Symbol.toPrimitive](): string
	{
		return this.toString();
	}

	clone(): V4Address
	{
		return new V4Address({ bytes: this.bytes.slice(), subnetSize: this.subnetSize });
	}


	static fromString(str: string): V4Address | undefined
	{
		if(!str || typeof (str) !== 'string')
			return;

		const [, addressStr, , subnetStr] = str.match(/^([^\/]+)(\/(\d+))?$/) || [];
		if(!addressStr)
			return;

		const strParts = addressStr.split('.');
		if(strParts.length !== 4 || strParts.some((strPart) => Number.isNaN(Number(strPart))))
			return;

		const parts = strParts.map((strPart) => parseInt(strPart));
		if(parts.some((part) => part < 0 || part > 255))
			return;

		let subnetSize = 32;
		if(subnetStr)
		{
			subnetSize = Number(subnetStr);
			if(!Number.isInteger(subnetSize) || subnetSize < 0 || subnetSize > 32)
				return;
		}


		const address = new V4Address({ bytes: parts, subnetSize: subnetSize });

		return address;
	}
	static fromBigInt(bigInt: bigint, subnetSize?: number): V4Address | undefined
	{
		if(bigInt > 0xFFFFFFFFn || bigInt < 0n)
			return undefined;


		const bytes = Array(4);
		for(let i = 3; i >= 0; --i)
		{
			bytes[i] = Number(bigInt & 0xFFn);
			bigInt >>= 8n;
		}

		return new V4Address({ bytes, subnetSize });
	}
}
