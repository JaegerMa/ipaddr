# ipaddr

Small TypeScript module to serialize and deserialize IPv4 and IPv6 addresses.

Features:
- Parsing IPv4 and IPv6 Addresses with or without CIDR
- Serializing IPv4 and IPv6 (compressed and uncompressed)
- Converting address to and from bigints to perform bit-operations
- Checking whether an address or an subnet is covered/included in another one

## Usage

### Parse IPv4 address
```js
let address = V4Address.fromString('1.2.3.4');
```
If an invalid address is given, `undefined` is returned.

### Parse IPv6 address
```js
let address = V6Address.fromString('::1');
```
If an invalid address is given, `undefined` is returned.

### Check whether a subnet covers/includes another one
```js
let net = V4Address.fromString('10.0.0.0/8');
let address = V4Address.fromString('5.0.0.0');
net.covers(address); // => false
```

The `covers` method also accepts a string.
If the given string is not a valid address, `false` is returned.
```js
let net = V4Address.fromString('10.0.0.0/8');
net.covers('5.0.0.0'); // => false
net.covers('10.2.3.4'); // => true
net.covers('10.0.0.300'); // => false
```

## Available types

- `function fromString(address: string, addressFamily?: number | undefined): V4Address | V6Address | undefined`  
  Parses string to an IPv4 or IPv6 address. Returns `undefined` for invalid data or unknown address family.
  - address: Address string to be parsed
  - addressFamily?: Optional parameter. Possible values: `4`, `6`, `0`, `undefined`. When `0` or `undefined`, the address is first tried to be parsed as V4Address and then as V6Address
	  Default: `undefined`
- `function fromBigInt(address: bigint, addressFamily: number, subnetSize?: number): V4Address | V6Address | undefined`  
  Reads an IPv4 address or net from a bigint. Returns `undefined` for invalid data.
  - address: bigint address to be read
  - addressFamily: Possible values: `4`, `6`. Unlike in the `fromString` method, this addressFamily parameter is not optional as it's way too risky to guess the address type of a bigint
  - subnetSize?: Optional parameter. When not set, the default subnet size of the address family is used

### `Address`
Base class representing an address or net.

#### Attributes
- `addressType: int`  
  Address type/version (4 or 6)
- `size: int`  
  Address size in bits (32 or 128)
- `bytes: int[]`  
  Address data as 8-bit unsigned
- `subnetSize: int`  
  Size of the subnet in bits

#### Methods
- `covers(Address | string): boolean`  
  Checks whether the current net covers/includes the given address or net
- `toString({ appendCIDR = undefined, compress = true }): string`  
  Formats the address to a string
    - appendCIDR: When undefined, the CIDR is appended only when the address object defines a subnet
	- compress: When true, the address is compressed as much as possible. Takes effect only on V6Address objects
- `toBigInt(): bigint`  
  Transforms address to a bigint
- `clone(): Address`
  Creates clone of this address object


### `V4Address` extends `Address`
IPv4 address or net

#### Attributes
- `addressType: int` => `4`
- `size: int` => `32`
- `bytes: int[4]`  
  Address data as 8-bit unsigned ints
- `subnetSize: int`  
  Size of the subnet mask in bits

#### Methods
- `covers(Address | string): boolean`  
  Checks whether the current net covers/includes the given address
- `toString({ appendCIDR: boolean = undefined }): string`  
  Formats the address to a string
    - appendCIDR: When appendCIDR is undefined, the CIDR is appended only when the address object defines a subnet
- `clone(): V4Address`  
  Creates a clone of this address object
- `static fromString(string): V4Address | undefined`  
  Parses an IPv4 address or net. Returns `undefined` for invalid data.
- `static fromBigInt(address: bigint, subnetSize?: number): V4Address | undefined`  
  Reads an IPv4 address or net from a bigint. Returns `undefined` for invalid data.
  - address: bigint address to be read
  - subnetSize?: Optional parameter. When not set, the default subnet size `32` is used


### `V6Address` extends `Address`
IPv6 address or net

#### Attributes
- `addressType: int` => `6`
- `size: int` => `128`
- `bytes: int[16]`  
  Address data as 8-bit unsigned ints
- `blocks: int[8]`  
  Address data as 16-bit unsigned ints
- `subnetSize: int`  
  Size of the subnet mask in bits

#### Methods
- `covers(Address | string): boolean`  
  Checks whether the current net covers/includes the given address
- `toString({ appendCIDR = undefined, compress = true }): string`  
  Formats the address to a string
    - appendCIDR: When undefined, the CIDR is appended only when the address object defines a subnet
	- compress: When true, the address is compressed as much as possible
- `toUncompressedString({ appendCIDR = undefined }): string`  
  Formats the address to an uncompressed string. This method is an alias for `toString({ compress: false })`
- `clone(): V6Address`  
  Creates clone of this address object
- `static fromString(string): V6Address | undefined`  
  Parses an IPv6 address or net. Returns `undefined` for invalid data.
- `static fromBigInt(address: bigint, subnetSize?: number): V6Address | undefined`  
  Reads an IPv6 address or net from a bigint. Returns `undefined` for invalid data.
  - address: bigint address to be read
  - subnetSize?: Optional parameter. When not set, the default subnet size `128` is used


## Examples
```js
let address = V4Address.fromString('1.2.3.4');
/* address => V4Address
	- addressType: 4
	- size: 32
	- bytes: [1, 2, 3, 4]
	- subnetSize: 32
*/

let address = V4Address.fromString('5.6.7.8/12');
/* address => V4Address
	- addressType: 4
	- size: 32
	- bytes: [5, 6, 7, 8]
	- subnetSize: 12
*/


let address = V4Address.fromString('1.2.288.4'); //Invalid third value
/* address => undefined */

let address = V4Address.fromString('1.2.3.4/42'); //Invalid CIDR value
/* address => undefined */



let address = V6Address.fromString('::1');
/* address => V6Address
	- addressType: 6
	- size: 128
	- bytes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
	- subnetSize: 128
*/
address.toUncompressedString(); // => 0000:0000:0000:0000:0000:0000:0000:0001
address.toString(); // => ::1
address.toString({ appendCIDR: true }); // => ::1/128


let address = V6Address.fromString('::1:0:0:0:0:0/100');
/* address => V6Address
	- addressType: 6
	- size: 128
	- bytes: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	- subnetSize: 128
*/
address.toUncompressedString(); // => 0000:0000:0001:0000:0000:0000:0000:0000/100
address.toString(); // => 0:0:1::/100
address.toString({ appendCIDR: false }); // => 0:0:1::
