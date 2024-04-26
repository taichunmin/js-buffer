/* eslint-disable @typescript-eslint/method-signature-style */

/**
 * @see [https://github.com/microsoft/TypeScript](https://github.com/search?q=repo%3Amicrosoft%2FTypeScript%20Uint8Array&type=code)
 */
export interface Uint8Array {
  /**
   * The size in bytes of each element in the array.
   */
  readonly BYTES_PER_ELEMENT: number

  [Symbol.iterator](): IterableIterator<number>

  readonly [Symbol.toStringTag]: 'Uint8Array'

  /**
   * Returns the item located at the specified index.
   * @param index - The zero-based index of the desired code unit. A negative index will count back from the last item.
   */
  at(index: number): number | undefined

  /**
   * The `ArrayBuffer` instance referenced by the array.
   *
   * This `ArrayBuffer` is not guaranteed to correspond exactly to the original `Buffer`. See the notes on `buf.byteOffset` for details.
   */
  readonly buffer: ArrayBufferLike

  /**
   * The length in bytes of the array.
   */
  readonly byteLength: number

  /**
   * The `byteOffset` of the `Buffer`s underlying `ArrayBuffer` object.
   *
   * When setting `byteOffset` in `Buffer.from(ArrayBuffer, byteOffset, length)`, or sometimes when allocating a `Buffer` smaller than `Buffer.poolSize`, the buffer does not start from a zero offset on the underlying ArrayBuffer.
   *
   * This can cause problems when accessing the underlying `ArrayBuffer` directly using `buf.buffer`, as other parts of the `ArrayBuffer` may be unrelated to the `Buffer` object itself.
   */
  readonly byteOffset: number

  /**
   * Returns the this object after copying a section of the array identified by start and end
   * to the same array starting at position target
   * @param target - If target is negative, it is treated as length+target where length is the
   * length of the array.
   * @param start - If start is negative, it is treated as length+start. If end is negative, it
   * is treated as length+end.
   * @param end - If not specified, length of the this object is used as its default value.
   */
  copyWithin(target: number, start: number, end?: number): this

  /**
   * Creates and returns an `iterator` of `[index, byte]` pairs from the contents of `buf`.
   */
  entries(): IterableIterator<[number, number]>

  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate - A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg - An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  every(predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): boolean

  /**
   * Changes all array elements from `start` to `end` index to a static `value` and returns the modified array
   * @param value - value to fill array section with
   * @param start - index to start filling the array at. If start is negative, it is treated as
   * length+start where length is the length of the array.
   * @param end - index to stop filling the array at. If end is negative, it is treated as
   * length+end.
   */
  fill(value: number, start?: number, end?: number): this

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate - A function that accepts up to three arguments. The filter method calls
   * the predicate function one time for each element in the array.
   * @param thisArg - An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  filter(predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any): Uint8Array

  /**
   * Returns the value of the first element in the array where predicate is true, and undefined
   * otherwise.
   * @param predicate - find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   * @param thisArg - If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  find(predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any): number | undefined

  /**
   * Returns the index of the first element in the array where predicate is true, and -1
   * otherwise.
   * @param predicate - find calls predicate once for each element of the array, in ascending
   * order, until it finds one where predicate returns true. If such an element is found,
   * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
   * @param thisArg - If provided, it will be used as the this value for each invocation of
   * predicate. If it is not provided, undefined is used instead.
   */
  findIndex(predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any): number

  /**
   * Performs the specified action for each element in an array.
   * @param callbackfn - A function that accepts up to three arguments. forEach calls the
   * callbackfn function one time for each element in the array.
   * @param thisArg - An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  forEach(callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any): void

  /**
   * Determines whether an array includes a certain element, returning true or false as appropriate.
   * @param searchElement - The element to search for.
   * @param fromIndex - The position in this array at which to begin searching for searchElement.
   */
  includes(searchElement: number, fromIndex?: number): boolean

  /**
   * Returns the index of the first occurrence of a value in an array.
   * @param searchElement - The value to locate in the array.
   * @param fromIndex - The array index at which to begin the search. If fromIndex is omitted, the
   *  search starts at index 0.
   */
  indexOf(searchElement: number, fromIndex?: number): number

  /**
   * Adds all the elements of an array separated by the specified separator string.
   * @param separator - A string used to separate one element of an array from the next in the
   * resulting String. If omitted, the array elements are separated with a comma.
   */
  join(separator?: string): string

  /**
   * Creates and returns an iterator of buf keys (indexes).
   */
  keys(): IterableIterator<number>

  /**
   * Returns the index of the last occurrence of a value in an array.
   * @param searchElement - The value to locate in the array.
   * @param fromIndex - The array index at which to begin the search. If fromIndex is omitted, the
   * search starts at index 0.
   */
  lastIndexOf(searchElement: number, fromIndex?: number): number

  /**
   * Returns the number of bytes in `buf`.
   */
  readonly length: number

  /**
   * Calls a defined callback function on each element of an array, and returns an array that
   * contains the results.
   * @param callbackfn - A function that accepts up to three arguments. The map method calls the
   * callbackfn function one time for each element in the array.
   * @param thisArg - An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  map(callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any): Uint8Array

  /**
   * Calls the specified callback function for all the elements in an array. The return value of
   * the callback function is the accumulated result, and is provided as an argument in the next
   * call to the callback function.
   * @param callbackfn - A function that accepts up to four arguments. The reduce method calls the
   * callbackfn function one time for each element in the array.
   */
  reduce(callbackfn: reduceCallbackFn<number>): number

  /**
   * Calls the specified callback function for all the elements in an array. The return value of
   * the callback function is the accumulated result, and is provided as an argument in the next
   * call to the callback function.
   * @param callbackfn - A function that accepts up to four arguments. The reduce method calls the
   * callbackfn function one time for each element in the array.
   * @param initialValue - If initialValue is specified, it is used as the initial value to start
   * the accumulation. The first call to the callbackfn function provides this value as an argument
   * instead of an array value.
   */
  reduce<U = number>(callbackfn: reduceCallbackFn<U>, initialValue: U): U

  /**
   * Calls the specified callback function for all the elements in an array, in descending order.
   * The return value of the callback function is the accumulated result, and is provided as an
   * argument in the next call to the callback function.
   * @param callbackfn - A function that accepts up to four arguments. The reduceRight method calls
   * the callbackfn function one time for each element in the array.
   */
  reduceRight(callbackfn: reduceCallbackFn<number>): number

  /**
   * Calls the specified callback function for all the elements in an array, in descending order.
   * The return value of the callback function is the accumulated result, and is provided as an
   * argument in the next call to the callback function.
   * @param callbackfn - A function that accepts up to four arguments. The reduceRight method calls
   * the callbackfn function one time for each element in the array.
   * @param initialValue - If initialValue is specified, it is used as the initial value to start
   * the accumulation. The first call to the callbackfn function provides this value as an
   * argument instead of an array value.
   */
  reduceRight<U = number>(callbackfn: reduceCallbackFn<U>, initialValue: U): U

  /**
   * Reverses the elements in an Array.
   */
  reverse(): Uint8Array

  /**
   * Sets a value or an array of values.
   * @param array - A typed or untyped array of values to set.
   * @param offset - The index in the current array at which the values are to be written.
   */
  set(array: ArrayLike<number>, offset?: number): void

  /**
   * Returns a section of an array.
   * @param start - The beginning of the specified portion of the array.
   * @param end - The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
   */
  slice(start?: number, end?: number): Uint8Array

  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param predicate - A function that accepts up to three arguments. The some method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value true, or until the end of the array.
   * @param thisArg - An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  some(predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): boolean

  /**
   * Sorts an array.
   * @param compareFn - Function used to determine the order of the elements. It is expected to return
   * a negative value if first argument is less than second argument, zero if they're equal and a positive
   * value otherwise. If omitted, the elements are sorted in ascending order.
   * ```ts
   * [11,2,22,1].sort((a, b) => a - b)
   * ```
   */
  sort(compareFn?: (a: number, b: number) => number): this

  /**
   * Gets a new Uint8Array view of the ArrayBuffer store for this array, referencing the elements
   * at begin, inclusive, up to end, exclusive.
   * @param begin - The index of the beginning of the array.
   * @param end - The index of the end of the array.
   */
  subarray(begin?: number, end?: number): Uint8Array

  /**
   * Converts a number to a string by using the current locale.
   */
  toLocaleString(): string

  /**
   * Returns a string representation of an array.
   */
  toString(): string

  /** Returns the primitive value of the specified object. */
  valueOf(): Uint8Array

  /**
   * Returns an list of values in the array
   */
  values(): IterableIterator<number>

  /**
   * The index operator `[index]` can be used to get and set the octet at position `index` in `this`. The values refer to individual bytes, so the legal value range is between `0x00` and `0xFF` (hex) or `0` and `255` (decimal).
   *
   * This operator is inherited from `Uint8Array`, so its behavior on out-of-bounds access is the same as `Uint8Array`. In other words, `this[index]` returns `undefined` when `index` is negative or greater or equal to `this.length`, and `buf[index] = value` does not modify the buffer if `index` is negative or `>= buf.length`.
   */
  [index: number]: number
}

type reduceCallbackFn<T> = (previousValue: T, currentValue: number, currentIndex: number, array: Uint8Array) => T
