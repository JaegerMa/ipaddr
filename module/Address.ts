export abstract class Address
{
	bytes: number[];
	subnetSize: number;

	abstract get addressType(): number;
	abstract get size(): number;

	constructor({ bytes, subnetSize }: { bytes: number[], subnetSize: number; })
	{
		this.bytes = bytes;
		this.subnetSize = subnetSize;
	}

	protected _covers(address: Address): boolean
	{
		if(this.addressType !== address.addressType)
			return false;
		if(address.subnetSize < this.subnetSize)
			return false;

		
		const maxBytes = this.size / 8;
		for(let byte = 0; byte * 8 < this.subnetSize && byte < maxBytes; ++byte)
		{
			if(this.bytes[byte] !== address.bytes[byte])
				return false;
		}


		const bitsLeft = this.subnetSize % 8;

		let ourByte = this.bytes[Math.floor(this.subnetSize / 8)];
		ourByte >>= 8 - bitsLeft;
		let theirByte = address.bytes[Math.floor(this.subnetSize / 8)];
		theirByte >>= 8 - bitsLeft;

		if(ourByte !== theirByte)
			return false;
		

		return true;
	}
	toBigInt(): bigint
	{
		let n = 0n;
		for(let i = 0; i < this.bytes.length; ++i)
			n = (n << 8n) | BigInt(this.bytes[i]);

		return n;
	}

	abstract toString(): string;
	abstract toString({ appendCIDR, compress }: { appendCIDR?: boolean | undefined, compress?: boolean; }): string;
	abstract clone(): Address;
}
