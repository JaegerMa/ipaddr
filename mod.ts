import { Address } from './module/Address.ts';
import { V4Address } from './module/V4Address.ts';
import { V6Address } from './module/V6Address.ts';


export { Address, V4Address, V6Address };

export function fromString(str: string, addressFamily: number | undefined = undefined): Address | undefined
{
	switch(addressFamily)
	{
		case 4:
			return V4Address.fromString(str);
		case 6:
			return V6Address.fromString(str);
		case 0:
		case undefined:
			return V4Address.fromString(str) ?? V6Address.fromString(str);
		default:
			return undefined;
	}

}
export function fromBigInt(bigInt: bigint, addressFamily: number, subnetSize?: number): Address | undefined
{
	switch(addressFamily)
	{
		case 4:
			return V4Address.fromBigInt(bigInt, subnetSize);
		case 6:
			return V6Address.fromBigInt(bigInt, subnetSize);
		default:
			return undefined;
	}
}
