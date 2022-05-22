(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.LD = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":7}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_VALUES = {
    emitDelay: 10,
    strictMode: false
};

/**
 * @typedef {object} EventEmitterListenerFunc
 * @property {boolean} once
 * @property {function} fn
 */

/**
 * @class EventEmitter
 *
 * @private
 * @property {Object.<string, EventEmitterListenerFunc[]>} _listeners
 * @property {string[]} events
 */

var EventEmitter = function () {

    /**
     * @constructor
     * @param {{}}      [opts]
     * @param {number}  [opts.emitDelay = 10] - Number in ms. Specifies whether emit will be sync or async. By default - 10ms. If 0 - fires sync
     * @param {boolean} [opts.strictMode = false] - is true, Emitter throws error on emit error with no listeners
     */

    function EventEmitter() {
        var opts = arguments.length <= 0 || arguments[0] === undefined ? DEFAULT_VALUES : arguments[0];

        _classCallCheck(this, EventEmitter);

        var emitDelay = void 0,
            strictMode = void 0;

        if (opts.hasOwnProperty('emitDelay')) {
            emitDelay = opts.emitDelay;
        } else {
            emitDelay = DEFAULT_VALUES.emitDelay;
        }
        this._emitDelay = emitDelay;

        if (opts.hasOwnProperty('strictMode')) {
            strictMode = opts.strictMode;
        } else {
            strictMode = DEFAULT_VALUES.strictMode;
        }
        this._strictMode = strictMode;

        this._listeners = {};
        this.events = [];
    }

    /**
     * @protected
     * @param {string} type
     * @param {function} listener
     * @param {boolean} [once = false]
     */


    _createClass(EventEmitter, [{
        key: '_addListenner',
        value: function _addListenner(type, listener, once) {
            if (typeof listener !== 'function') {
                throw TypeError('listener must be a function');
            }

            if (this.events.indexOf(type) === -1) {
                this._listeners[type] = [{
                    once: once,
                    fn: listener
                }];
                this.events.push(type);
            } else {
                this._listeners[type].push({
                    once: once,
                    fn: listener
                });
            }
        }

        /**
         * Subscribes on event type specified function
         * @param {string} type
         * @param {function} listener
         */

    }, {
        key: 'on',
        value: function on(type, listener) {
            this._addListenner(type, listener, false);
        }

        /**
         * Subscribes on event type specified function to fire only once
         * @param {string} type
         * @param {function} listener
         */

    }, {
        key: 'once',
        value: function once(type, listener) {
            this._addListenner(type, listener, true);
        }

        /**
         * Removes event with specified type. If specified listenerFunc - deletes only one listener of specified type
         * @param {string} eventType
         * @param {function} [listenerFunc]
         */

    }, {
        key: 'off',
        value: function off(eventType, listenerFunc) {
            var _this = this;

            var typeIndex = this.events.indexOf(eventType);
            var hasType = eventType && typeIndex !== -1;

            if (hasType) {
                if (!listenerFunc) {
                    delete this._listeners[eventType];
                    this.events.splice(typeIndex, 1);
                } else {
                    (function () {
                        var removedEvents = [];
                        var typeListeners = _this._listeners[eventType];

                        typeListeners.forEach(
                        /**
                         * @param {EventEmitterListenerFunc} fn
                         * @param {number} idx
                         */
                        function (fn, idx) {
                            if (fn.fn === listenerFunc) {
                                removedEvents.unshift(idx);
                            }
                        });

                        removedEvents.forEach(function (idx) {
                            typeListeners.splice(idx, 1);
                        });

                        if (!typeListeners.length) {
                            _this.events.splice(typeIndex, 1);
                            delete _this._listeners[eventType];
                        }
                    })();
                }
            }
        }

        /**
         * Applies arguments to specified event type
         * @param {string} eventType
         * @param {*[]} eventArguments
         * @protected
         */

    }, {
        key: '_applyEvents',
        value: function _applyEvents(eventType, eventArguments) {
            var typeListeners = this._listeners[eventType];

            if (!typeListeners || !typeListeners.length) {
                if (this._strictMode) {
                    throw 'No listeners specified for event: ' + eventType;
                } else {
                    return;
                }
            }

            var removableListeners = [];
            typeListeners.forEach(function (eeListener, idx) {
                eeListener.fn.apply(null, eventArguments);
                if (eeListener.once) {
                    removableListeners.unshift(idx);
                }
            });

            removableListeners.forEach(function (idx) {
                typeListeners.splice(idx, 1);
            });
        }

        /**
         * Emits event with specified type and params.
         * @param {string} type
         * @param eventArgs
         */

    }, {
        key: 'emit',
        value: function emit(type) {
            var _this2 = this;

            for (var _len = arguments.length, eventArgs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                eventArgs[_key - 1] = arguments[_key];
            }

            if (this._emitDelay) {
                setTimeout(function () {
                    _this2._applyEvents.call(_this2, type, eventArgs);
                }, this._emitDelay);
            } else {
                this._applyEvents(type, eventArgs);
            }
        }

        /**
         * Emits event with specified type and params synchronously.
         * @param {string} type
         * @param eventArgs
         */

    }, {
        key: 'emitSync',
        value: function emitSync(type) {
            for (var _len2 = arguments.length, eventArgs = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                eventArgs[_key2 - 1] = arguments[_key2];
            }

            this._applyEvents(type, eventArgs);
        }

        /**
         * Destroys EventEmitter
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            this._listeners = {};
            this.events = [];
        }
    }]);

    return EventEmitter;
}();

module.exports = EventEmitter;

},{}],4:[function(require,module,exports){
(function (global){
;(function(){

  /* UNBUILD */
  var root;
  if(typeof window !== "undefined"){ root = window }
  if(typeof global !== "undefined"){ root = global }
  root = root || {};
  var console = root.console || {log: function(){}};
  function USE(arg, req){
    return req? require(arg) : arg.slice? USE[R(arg)] : function(mod, path){
      arg(mod = {exports: {}});
      USE[R(path)] = mod.exports;
    }
    function R(p){
      return p.split('/').slice(-1).toString().replace('.js','');
    }
  }
  if(typeof module !== "undefined"){ var common = module }
  /* UNBUILD */

	;USE(function(module){
		// Generic javascript utilities.
		var Type = {};
		//Type.fns = Type.fn = {is: function(fn){ return (!!fn && fn instanceof Function) }}
		Type.fn = {is: function(fn){ return (!!fn && 'function' == typeof fn) }}
		Type.bi = {is: function(b){ return (b instanceof Boolean || typeof b == 'boolean') }}
		Type.num = {is: function(n){ return !list_is(n) && ((n - parseFloat(n) + 1) >= 0 || Infinity === n || -Infinity === n) }}
		Type.text = {is: function(t){ return (typeof t == 'string') }}
		Type.text.ify = function(t){
			if(Type.text.is(t)){ return t }
			if(typeof JSON !== "undefined"){ return JSON.stringify(t) }
			return (t && t.toString)? t.toString() : t;
		}
		Type.text.random = function(l, c){
			var s = '';
			l = l || 24; // you are not going to make a 0 length random number, so no need to check type
			c = c || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz';
			while(l > 0){ s += c.charAt(Math.floor(Math.random() * c.length)); l-- }
			return s;
		}
		Type.text.match = function(t, o){ var tmp, u;
			if('string' !== typeof t){ return false }
			if('string' == typeof o){ o = {'=': o} }
			o = o || {};
			tmp = (o['='] || o['*'] || o['>'] || o['<']);
			if(t === tmp){ return true }
			if(u !== o['=']){ return false }
			tmp = (o['*'] || o['>'] || o['<']);
			if(t.slice(0, (tmp||'').length) === tmp){ return true }
			if(u !== o['*']){ return false }
			if(u !== o['>'] && u !== o['<']){
				return (t >= o['>'] && t <= o['<'])? true : false;
			}
			if(u !== o['>'] && t >= o['>']){ return true }
			if(u !== o['<'] && t <= o['<']){ return true }
			return false;
		}
		Type.list = {is: function(l){ return (l instanceof Array) }}
		Type.list.slit = Array.prototype.slice;
		Type.list.sort = function(k){ // creates a new sort function based off some key
			return function(A,B){
				if(!A || !B){ return 0 } A = A[k]; B = B[k];
				if(A < B){ return -1 }else if(A > B){ return 1 }
				else { return 0 }
			}
		}
		Type.list.map = function(l, c, _){ return obj_map(l, c, _) }
		Type.list.index = 1; // change this to 0 if you want non-logical, non-mathematical, non-matrix, non-convenient array notation
		Type.obj = {is: function(o){ return o? (o instanceof Object && o.constructor === Object) || Object.prototype.toString.call(o).match(/^\[object (\w+)\]$/)[1] === 'Object' : false }}
		Type.obj.put = function(o, k, v){ return (o||{})[k] = v, o }
		Type.obj.has = function(o, k){ return o && Object.prototype.hasOwnProperty.call(o, k) }
		Type.obj.del = function(o, k){
			if(!o){ return }
			o[k] = null;
			delete o[k];
			return o;
		}
		Type.obj.as = function(o, k, v, u){ return o[k] = o[k] || (u === v? {} : v) }
		Type.obj.ify = function(o){
			if(obj_is(o)){ return o }
			try{o = JSON.parse(o);
			}catch(e){o={}};
			return o;
		}
		;(function(){ var u;
			function map(v,k){
				if(obj_has(this,k) && u !== this[k]){ return }
				this[k] = v;
			}
			Type.obj.to = function(from, to){
				to = to || {};
				obj_map(from, map, to);
				return to;
			}
		}());
		Type.obj.copy = function(o){ // because http://web.archive.org/web/20140328224025/http://jsperf.com/cloning-an-object/2
			return !o? o : JSON.parse(JSON.stringify(o)); // is shockingly faster than anything else, and our data has to be a subset of JSON anyways!
		}
		;(function(){
			function empty(v,i){ var n = this.n;
				if(n && (i === n || (obj_is(n) && obj_has(n, i)))){ return }
				if(i){ return true }
			}
			Type.obj.empty = function(o, n){
				if(!o){ return true }
				return obj_map(o,empty,{n:n})? false : true;
			}
		}());
		;(function(){
			function t(k,v){
				if(2 === arguments.length){
					t.r = t.r || {};
					t.r[k] = v;
					return;
				} t.r = t.r || [];
				t.r.push(k);
			};
			var keys = Object.keys;
			Type.obj.map = function(l, c, _){
				var u, i = 0, x, r, ll, lle, f = fn_is(c);
				t.r = null;
				if(keys && obj_is(l)){
					ll = keys(l); lle = true;
				}
				if(list_is(l) || ll){
					x = (ll || l).length;
					for(;i < x; i++){
						var ii = (i + Type.list.index);
						if(f){
							r = lle? c.call(_ || this, l[ll[i]], ll[i], t) : c.call(_ || this, l[i], ii, t);
							if(r !== u){ return r }
						} else {
							//if(Type.test.is(c,l[i])){ return ii } // should implement deep equality testing!
							if(c === l[lle? ll[i] : i]){ return ll? ll[i] : ii } // use this for now
						}
					}
				} else {
					for(i in l){
						if(f){
							if(obj_has(l,i)){
								r = _? c.call(_, l[i], i, t) : c(l[i], i, t);
								if(r !== u){ return r }
							}
						} else {
							//if(a.test.is(c,l[i])){ return i } // should implement deep equality testing!
							if(c === l[i]){ return i } // use this for now
						}
					}
				}
				return f? t.r : Type.list.index? 0 : -1;
			}
		}());
		Type.time = {};
		Type.time.is = function(t){ return t? t instanceof Date : (+new Date().getTime()) }

		var fn_is = Type.fn.is;
		var list_is = Type.list.is;
		var obj = Type.obj, obj_is = obj.is, obj_has = obj.has, obj_map = obj.map;
		module.exports = Type;
	})(USE, './type');

	;USE(function(module){
		// On event emitter generic javascript utility.
		module.exports = function onto(tag, arg, as){
			if(!tag){ return {to: onto} }
			var u, tag = (this.tag || (this.tag = {}))[tag] ||
			(this.tag[tag] = {tag: tag, to: onto._ = {
				next: function(arg){ var tmp;
					if((tmp = this.to)){
						tmp.next(arg);
				}}
			}});
			if(arg instanceof Function){
				var be = {
					off: onto.off ||
					(onto.off = function(){
						if(this.next === onto._.next){ return !0 }
						if(this === this.the.last){
							this.the.last = this.back;
						}
						this.to.back = this.back;
						this.next = onto._.next;
						this.back.to = this.to;
						if(this.the.last === this.the){
							delete this.on.tag[this.the.tag];
						}
					}),
					to: onto._,
					next: arg,
					the: tag,
					on: this,
					as: as,
				};
				(be.back = tag.last || tag).to = be;
				return tag.last = be;
			}
			if((tag = tag.to) && u !== arg){ tag.next(arg) }
			return tag;
		};
	})(USE, './onto');

	;USE(function(module){
		/* Based on the Hypothetical Amnesia Machine thought experiment */
		function HAM(machineState, incomingState, currentState, incomingValue, currentValue){
			if(machineState < incomingState){
				return {defer: true}; // the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
			}
			if(incomingState < currentState){
				return {historical: true}; // the incoming value is within the boundary of the machine's state, but not within the range.

			}
			if(currentState < incomingState){
				return {converge: true, incoming: true}; // the incoming value is within both the boundary and the range of the machine's state.

			}
			if(incomingState === currentState){
				incomingValue = Lexical(incomingValue) || "";
				currentValue = Lexical(currentValue) || "";
				if(incomingValue === currentValue){ // Note: while these are practically the same, the deltas could be technically different
					return {state: true};
				}
				/*
					The following is a naive implementation, but will always work.
					Never change it unless you have specific needs that absolutely require it.
					If changed, your data will diverge unless you guarantee every peer's algorithm has also been changed to be the same.
					As a result, it is highly discouraged to modify despite the fact that it is naive,
					because convergence (data integrity) is generally more important.
					Any difference in this algorithm must be given a new and different name.
				*/
				if(incomingValue < currentValue){ // Lexical only works on simple value types!
					return {converge: true, current: true};
				}
				if(currentValue < incomingValue){ // Lexical only works on simple value types!
					return {converge: true, incoming: true};
				}
			}
			return {err: "Invalid CRDT Data: "+ incomingValue +" to "+ currentValue +" at "+ incomingState +" to "+ currentState +"!"};
		}
		if(typeof JSON === 'undefined'){
			throw new Error(
				'JSON is not included in this browser. Please load it first: ' +
				'ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js'
			);
		}
		var Lexical = JSON.stringify, undefined;
		module.exports = HAM;
	})(USE, './HAM');

	;USE(function(module){
		var Type = USE('./type');
		var Val = {};
		Val.is = function(v){ // Valid values are a subset of JSON: null, binary, number (!Infinity), text, or a soul relation. Arrays need special algorithms to handle concurrency, so they are not supported directly. Use an extension that supports them if needed but research their problems first.
			if(v === u){ return false }
			if(v === null){ return true } // "deletes", nulling out keys.
			if(v === Infinity){ return false } // we want this to be, but JSON does not support it, sad face.
			if(text_is(v) // by "text" we mean strings.
			|| bi_is(v) // by "binary" we mean boolean.
			|| num_is(v)){ // by "number" we mean integers or decimals.
				return true; // simple values are valid.
			}
			return Val.link.is(v) || false; // is the value a soul relation? Then it is valid and return it. If not, everything else remaining is an invalid data type. Custom extensions can be built on top of these primitives to support other types.
		}
		Val.link = Val.rel = {_: '#'};
		;(function(){
			Val.link.is = function(v){ // this defines whether an object is a soul relation or not, they look like this: {'#': 'UUID'}
				if(v && v[rel_] && !v._ && obj_is(v)){ // must be an object.
					var o = {};
					obj_map(v, map, o);
					if(o.id){ // a valid id was found.
						return o.id; // yay! Return it.
					}
				}
				return false; // the value was not a valid soul relation.
			}
			function map(s, k){ var o = this; // map over the object...
				if(o.id){ return o.id = false } // if ID is already defined AND we're still looping through the object, it is considered invalid.
				if(k == rel_ && text_is(s)){ // the key should be '#' and have a text value.
					o.id = s; // we found the soul!
				} else {
					return o.id = false; // if there exists anything else on the object that isn't the soul, then it is considered invalid.
				}
			}
		}());
		Val.link.ify = function(t){ return obj_put({}, rel_, t) } // convert a soul into a relation and return it.
		Type.obj.has._ = '.';
		var rel_ = Val.link._, u;
		var bi_is = Type.bi.is;
		var num_is = Type.num.is;
		var text_is = Type.text.is;
		var obj = Type.obj, obj_is = obj.is, obj_put = obj.put, obj_map = obj.map;
		module.exports = Val;
	})(USE, './val');

	;USE(function(module){
		var Type = USE('./type');
		var Val = USE('./val');
		var Node = {_: '_'};
		Node.soul = function(n, o){ return (n && n._ && n._[o || soul_]) } // convenience function to check to see if there is a soul on a node and return it.
		Node.soul.ify = function(n, o){ // put a soul on an object.
			o = (typeof o === 'string')? {soul: o} : o || {};
			n = n || {}; // make sure it exists.
			n._ = n._ || {}; // make sure meta exists.
			n._[soul_] = o.soul || n._[soul_] || text_random(); // put the soul on it.
			return n;
		}
		Node.soul._ = Val.link._;
		;(function(){
			Node.is = function(n, cb, as){ var s; // checks to see if an object is a valid node.
				if(!obj_is(n)){ return false } // must be an object.
				if(s = Node.soul(n)){ // must have a soul on it.
					return !obj_map(n, map, {as:as,cb:cb,s:s,n:n});
				}
				return false; // nope! This was not a valid node.
			}
			function map(v, k){ // we invert this because the way we check for this is via a negation.
				if(k === Node._){ return } // skip over the metadata.
				if(!Val.is(v)){ return true } // it is true that this is an invalid node.
				if(this.cb){ this.cb.call(this.as, v, k, this.n, this.s) } // optionally callback each key/value.
			}
		}());
		;(function(){
			Node.ify = function(obj, o, as){ // returns a node from a shallow object.
				if(!o){ o = {} }
				else if(typeof o === 'string'){ o = {soul: o} }
				else if(o instanceof Function){ o = {map: o} }
				if(o.map){ o.node = o.map.call(as, obj, u, o.node || {}) }
				if(o.node = Node.soul.ify(o.node || {}, o)){
					obj_map(obj, map, {o:o,as:as});
				}
				return o.node; // This will only be a valid node if the object wasn't already deep!
			}
			function map(v, k){ var o = this.o, tmp, u; // iterate over each key/value.
				if(o.map){
					tmp = o.map.call(this.as, v, ''+k, o.node);
					if(u === tmp){
						obj_del(o.node, k);
					} else
					if(o.node){ o.node[k] = tmp }
					return;
				}
				if(Val.is(v)){
					o.node[k] = v;
				}
			}
		}());
		var obj = Type.obj, obj_is = obj.is, obj_del = obj.del, obj_map = obj.map;
		var text = Type.text, text_random = text.random;
		var soul_ = Node.soul._;
		var u;
		module.exports = Node;
	})(USE, './node');

	;USE(function(module){
		var Type = USE('./type');
		var Node = USE('./node');
		function State(){
			var t;
			/*if(perf){
				t = start + perf.now(); // Danger: Accuracy decays significantly over time, even if precise.
			} else {*/
				t = time();
			//}
			if(last < t){
				return N = 0, last = t + State.drift;
			}
			return last = t + ((N += 1) / D) + State.drift;
		}
		var time = Type.time.is, last = -Infinity, N = 0, D = 1000; // WARNING! In the future, on machines that are D times faster than 2016AD machines, you will want to increase D by another several orders of magnitude so the processing speed never out paces the decimal resolution (increasing an integer effects the state accuracy).
		var perf = (typeof performance !== 'undefined')? (performance.timing && performance) : false, start = (perf && perf.timing && perf.timing.navigationStart) || (perf = false);
		State._ = '>';
		State.drift = 0;
		State.is = function(n, k, o){ // convenience function to get the state on a key on a node and return it.
			var tmp = (k && n && n[N_] && n[N_][State._]) || o;
			if(!tmp){ return }
			return num_is(tmp = tmp[k])? tmp : -Infinity;
		}
		State.lex = function(){ return State().toString(36).replace('.','') }
		State.ify = function(n, k, s, v, soul){ // put a key's state on a node.
			if(!n || !n[N_]){ // reject if it is not node-like.
				if(!soul){ // unless they passed a soul
					return;
				}
				n = Node.soul.ify(n, soul); // then make it so!
			}
			var tmp = obj_as(n[N_], State._); // grab the states data.
			if(u !== k && k !== N_){
				if(num_is(s)){
					tmp[k] = s; // add the valid state.
				}
				if(u !== v){ // Note: Not its job to check for valid values!
					n[k] = v;
				}
			}
			return n;
		}
		State.to = function(from, k, to){
			var val = (from||{})[k];
			if(obj_is(val)){
				val = obj_copy(val);
			}
			return State.ify(to, k, State.is(from, k), val, Node.soul(from));
		}
		;(function(){
			State.map = function(cb, s, as){ var u; // for use with Node.ify
				var o = obj_is(o = cb || s)? o : null;
				cb = fn_is(cb = cb || s)? cb : null;
				if(o && !cb){
					s = num_is(s)? s : State();
					o[N_] = o[N_] || {};
					obj_map(o, map, {o:o,s:s});
					return o;
				}
				as = as || obj_is(s)? s : u;
				s = num_is(s)? s : State();
				return function(v, k, o, opt){
					if(!cb){
						map.call({o: o, s: s}, v,k);
						return v;
					}
					cb.call(as || this || {}, v, k, o, opt);
					if(obj_has(o,k) && u === o[k]){ return }
					map.call({o: o, s: s}, v,k);
				}
			}
			function map(v,k){
				if(N_ === k){ return }
				State.ify(this.o, k, this.s) ;
			}
		}());
		var obj = Type.obj, obj_as = obj.as, obj_has = obj.has, obj_is = obj.is, obj_map = obj.map, obj_copy = obj.copy;
		var num = Type.num, num_is = num.is;
		var fn = Type.fn, fn_is = fn.is;
		var N_ = Node._, u;
		module.exports = State;
	})(USE, './state');

	;USE(function(module){
		var Type = USE('./type');
		var Val = USE('./val');
		var Node = USE('./node');
		var Graph = {};
		;(function(){
			Graph.is = function(g, cb, fn, as){ // checks to see if an object is a valid graph.
				if(!g || !obj_is(g) || obj_empty(g)){ return false } // must be an object.
				return !obj_map(g, map, {cb:cb,fn:fn,as:as}); // makes sure it wasn't an empty object.
			}
			function map(n, s){ // we invert this because the way'? we check for this is via a negation.
				if(!n || s !== Node.soul(n) || !Node.is(n, this.fn, this.as)){ return true } // it is true that this is an invalid graph.
				if(!this.cb){ return }
				nf.n = n; nf.as = this.as; // sequential race conditions aren't races.
				this.cb.call(nf.as, n, s, nf);
			}
			function nf(fn){ // optional callback for each node.
				if(fn){ Node.is(nf.n, fn, nf.as) } // where we then have an optional callback for each key/value.
			}
		}());
		;(function(){
			Graph.ify = function(obj, env, as){
				var at = {path: [], obj: obj};
				if(!env){
					env = {};
				} else
				if(typeof env === 'string'){
					env = {soul: env};
				} else
				if(env instanceof Function){
					env.map = env;
				}
				if(env.soul){
					at.link = Val.link.ify(env.soul);
				}
				env.shell = (as||{}).shell;
				env.graph = env.graph || {};
				env.seen = env.seen || [];
				env.as = env.as || as;
				node(env, at);
				env.root = at.node;
				return env.graph;
			}
			function node(env, at){ var tmp;
				if(tmp = seen(env, at)){ return tmp }
				at.env = env;
				at.soul = soul;
				if(Node.ify(at.obj, map, at)){
					at.link = at.link || Val.link.ify(Node.soul(at.node));
					if(at.obj !== env.shell){
						env.graph[Val.link.is(at.link)] = at.node;
					}
				}
				return at;
			}
			function map(v,k,n){
				var at = this, env = at.env, is, tmp;
				if(Node._ === k && obj_has(v,Val.link._)){
					return n._; // TODO: Bug?
				}
				if(!(is = valid(v,k,n, at,env))){ return }
				if(!k){
					at.node = at.node || n || {};
					if(obj_has(v, Node._) && Node.soul(v)){ // ? for safety ?
						at.node._ = obj_copy(v._);
					}
					at.node = Node.soul.ify(at.node, Val.link.is(at.link));
					at.link = at.link || Val.link.ify(Node.soul(at.node));
				}
				if(tmp = env.map){
					tmp.call(env.as || {}, v,k,n, at);
					if(obj_has(n,k)){
						v = n[k];
						if(u === v){
							obj_del(n, k);
							return;
						}
						if(!(is = valid(v,k,n, at,env))){ return }
					}
				}
				if(!k){ return at.node }
				if(true === is){
					return v;
				}
				tmp = node(env, {obj: v, path: at.path.concat(k)});
				if(!tmp.node){ return }
				return tmp.link; //{'#': Node.soul(tmp.node)};
			}
			function soul(id){ var at = this;
				var prev = Val.link.is(at.link), graph = at.env.graph;
				at.link = at.link || Val.link.ify(id);
				at.link[Val.link._] = id;
				if(at.node && at.node[Node._]){
					at.node[Node._][Val.link._] = id;
				}
				if(obj_has(graph, prev)){
					graph[id] = graph[prev];
					obj_del(graph, prev);
				}
			}
			function valid(v,k,n, at,env){ var tmp;
				if(Val.is(v)){ return true }
				if(obj_is(v)){ return 1 }
				if(tmp = env.invalid){
					v = tmp.call(env.as || {}, v,k,n);
					return valid(v,k,n, at,env);
				}
				env.err = "Invalid value at '" + at.path.concat(k).join('.') + "'!";
				if(Type.list.is(v)){ env.err += " Use `.set(item)` instead of an Array." }
			}
			function seen(env, at){
				var arr = env.seen, i = arr.length, has;
				while(i--){ has = arr[i];
					if(at.obj === has.obj){ return has }
				}
				arr.push(at);
			}
		}());
		Graph.node = function(node){
			var soul = Node.soul(node);
			if(!soul){ return }
			return obj_put({}, soul, node);
		}
		;(function(){
			Graph.to = function(graph, root, opt){
				if(!graph){ return }
				var obj = {};
				opt = opt || {seen: {}};
				obj_map(graph[root], map, {obj:obj, graph: graph, opt: opt});
				return obj;
			}
			function map(v,k){ var tmp, obj;
				if(Node._ === k){
					if(obj_empty(v, Val.link._)){
						return;
					}
					this.obj[k] = obj_copy(v);
					return;
				}
				if(!(tmp = Val.link.is(v))){
					this.obj[k] = v;
					return;
				}
				if(obj = this.opt.seen[tmp]){
					this.obj[k] = obj;
					return;
				}
				this.obj[k] = this.opt.seen[tmp] = Graph.to(this.graph, tmp, this.opt);
			}
		}());
		var fn_is = Type.fn.is;
		var obj = Type.obj, obj_is = obj.is, obj_del = obj.del, obj_has = obj.has, obj_empty = obj.empty, obj_put = obj.put, obj_map = obj.map, obj_copy = obj.copy;
		var u;
		module.exports = Graph;
	})(USE, './graph');

	;USE(function(module){
		// request / response module, for asking and acking messages.
		USE('./onto'); // depends upon onto!
		module.exports = function ask(cb, as){
			if(!this.on){ return }
			if(!(cb instanceof Function)){
				if(!cb || !as){ return }
				var id = cb['#'] || cb, tmp = (this.tag||empty)[id];
				if(!tmp){ return }
				tmp = this.on(id, as);
				clearTimeout(tmp.err);
				return true;
			}
			var id = (as && as['#']) || Math.random().toString(36).slice(2);
			if(!cb){ return id }
			var to = this.on(id, cb, as);
			to.err = to.err || setTimeout(function(){
				to.next({err: "Error: No ACK received yet.", lack: true});
				to.off();
			}, (this.opt||{}).lack || 9000);
			return id;
		}
	})(USE, './ask');

	;USE(function(module){
		var Type = USE('./type');
		function Dup(opt){
			var dup = {s:{}};
			opt = opt || {max: 1000, age: 1000 * 9};//1000 * 60 * 2};
			dup.check = function(id){ var tmp;
				if(!(tmp = dup.s[id])){ return false }
				if(tmp.pass){ return tmp.pass = false }
				return dup.track(id);
			}
			dup.track = function(id, pass){
				var it = dup.s[id] || (dup.s[id] = {});
				it.was = time_is();
				if(pass){ it.pass = true }
				if(!dup.to){
					dup.to = setTimeout(function(){
						var now = time_is();
						Type.obj.map(dup.s, function(it, id){
							if(it && opt.age > (now - it.was)){ return }
							Type.obj.del(dup.s, id);
						});
						dup.to = null;
					}, opt.age + 9);
				}
				return it;
			}
			return dup;
		}
		var time_is = Type.time.is;
		module.exports = Dup;
	})(USE, './dup');

	;USE(function(module){

		function Gun(o){
			if(o instanceof Gun){ return (this._ = {gun: this, $: this}).$ }
			if(!(this instanceof Gun)){ return new Gun(o) }
			return Gun.create(this._ = {gun: this, $: this, opt: o});
		}

		Gun.is = function($){ return ($ instanceof Gun) || ($ && $._ && ($ === $._.$)) || false }

		Gun.version = 0.9;

		Gun.chain = Gun.prototype;
		Gun.chain.toJSON = function(){};

		var Type = USE('./type');
		Type.obj.to(Type, Gun);
		Gun.HAM = USE('./HAM');
		Gun.val = USE('./val');
		Gun.node = USE('./node');
		Gun.state = USE('./state');
		Gun.graph = USE('./graph');
		Gun.on = USE('./onto');
		Gun.ask = USE('./ask');
		Gun.dup = USE('./dup');

		;(function(){
			Gun.create = function(at){
				at.root = at.root || at;
				at.graph = at.graph || {};
				at.on = at.on || Gun.on;
				at.ask = at.ask || Gun.ask;
				at.dup = at.dup || Gun.dup();
				var gun = at.$.opt(at.opt);
				if(!at.once){
					at.on('in', root, at);
					at.on('out', root, {at: at, out: root});
					Gun.on('create', at);
					at.on('create', at);
				}
				at.once = 1;
				return gun;
			}
			function root(msg){
				//add to.next(at); // TODO: MISSING FEATURE!!!
				var ev = this, as = ev.as, at = as.at || as, gun = at.$, dup, tmp;
				if(!(tmp = msg['#'])){ tmp = msg['#'] = text_rand(9) }
				if((dup = at.dup).check(tmp)){
					if(as.out === msg.out){
						msg.out = u;
						ev.to.next(msg);
					}
					return;
				}
				dup.track(tmp);
				if(!at.ask(msg['@'], msg)){
					if(msg.get){
						Gun.on.get(msg, gun); //at.on('get', get(msg));
					}
					if(msg.put){
						Gun.on.put(msg, gun); //at.on('put', put(msg));
					}
				}
				ev.to.next(msg);
				if(!as.out){
					msg.out = root;
					at.on('out', msg);
				}
			}
		}());

		;(function(){
			Gun.on.put = function(msg, gun){
				var at = gun._, ctx = {$: gun, graph: at.graph, put: {}, map: {}, souls: {}, machine: Gun.state(), ack: msg['@'], cat: at, stop: {}};
				if(!Gun.graph.is(msg.put, null, verify, ctx)){ ctx.err = "Error: Invalid graph!" }
				if(ctx.err){ return at.on('in', {'@': msg['#'], err: Gun.log(ctx.err) }) }
				obj_map(ctx.put, merge, ctx);
				if(!ctx.async){ obj_map(ctx.map, map, ctx) }
				if(u !== ctx.defer){
					setTimeout(function(){
						Gun.on.put(msg, gun);
					}, ctx.defer - ctx.machine);
				}
				if(!ctx.diff){ return }
				at.on('put', obj_to(msg, {put: ctx.diff}));
			};
			function verify(val, key, node, soul){ var ctx = this;
				var state = Gun.state.is(node, key), tmp;
				if(!state){ return ctx.err = "Error: No state on '"+key+"' in node '"+soul+"'!" }
				var vertex = ctx.graph[soul] || empty, was = Gun.state.is(vertex, key, true), known = vertex[key];
				var HAM = Gun.HAM(ctx.machine, state, was, val, known);
				if(!HAM.incoming){
					if(HAM.defer){ // pick the lowest
						ctx.defer = (state < (ctx.defer || Infinity))? state : ctx.defer;
					}
					return;
				}
				ctx.put[soul] = Gun.state.to(node, key, ctx.put[soul]);
				(ctx.diff || (ctx.diff = {}))[soul] = Gun.state.to(node, key, ctx.diff[soul]);
				ctx.souls[soul] = true;
			}
			function merge(node, soul){
				var ctx = this, cat = ctx.$._, at = (cat.next || empty)[soul];
				if(!at){
					if(!(cat.opt||empty).super){
						ctx.souls[soul] = false;
						return;
					}
					at = (ctx.$.get(soul)._);
				}
				var msg = ctx.map[soul] = {
					put: node,
					get: soul,
					$: at.$
				}, as = {ctx: ctx, msg: msg};
				ctx.async = !!cat.tag.node;
				if(ctx.ack){ msg['@'] = ctx.ack }
				obj_map(node, each, as);
				if(!ctx.async){ return }
				if(!ctx.and){
					// If it is async, we only need to setup one listener per context (ctx)
					cat.on('node', function(m){
						this.to.next(m); // make sure to call other context's listeners.
						if(m !== ctx.map[m.get]){ return } // filter out events not from this context!
						ctx.souls[m.get] = false; // set our many-async flag
						obj_map(m.put, patch, m); // merge into view
						if(obj_map(ctx.souls, function(v){ if(v){ return v } })){ return } // if flag still outstanding, keep waiting.
						if(ctx.c){ return } ctx.c = 1; // failsafe for only being called once per context.
						this.off();
						obj_map(ctx.map, map, ctx); // all done, trigger chains.
					});
				}
				ctx.and = true;
				cat.on('node', msg); // each node on the current context's graph needs to be emitted though.
			}
			function each(val, key){
				var ctx = this.ctx, graph = ctx.graph, msg = this.msg, soul = msg.get, node = msg.put, at = (msg.$._), tmp;
				graph[soul] = Gun.state.to(node, key, graph[soul]);
				if(ctx.async){ return }
				at.put = Gun.state.to(node, key, at.put);
			}
			function patch(val, key){
				var msg = this, node = msg.put, at = (msg.$._);
				at.put = Gun.state.to(node, key, at.put);
			}
			function map(msg, soul){
				if(!msg.$){ return }
				this.cat.stop = this.stop; // temporary fix till a better solution?
				(msg.$._).on('in', msg);
				this.cat.stop = null; // temporary fix till a better solution?
			}

			Gun.on.get = function(msg, gun){
				var root = gun._, get = msg.get, soul = get[_soul], node = root.graph[soul], has = get[_has], tmp;
				var next = root.next || (root.next = {}), at = next[soul];
				if(!node){ return root.on('get', msg) }
				if(has){
					if('string' != typeof has || !obj_has(node, has)){ return root.on('get', msg) }
					node = Gun.state.to(node, has);
					// If we have a key in-memory, do we really need to fetch?
					// Maybe... in case the in-memory key we have is a local write
					// we still need to trigger a pull/merge from peers.
				} else {
					node = Gun.obj.copy(node);
				}
				node = Gun.graph.node(node);
				tmp = (at||empty).ack;
				root.on('in', {
					'@': msg['#'],
					how: 'mem',
					put: node,
					$: gun
				});
				//if(0 < tmp){ return }
				root.on('get', msg);
			}
		}());

		;(function(){
			Gun.chain.opt = function(opt){
				opt = opt || {};
				var gun = this, at = gun._, tmp = opt.peers || opt;
				if(!obj_is(opt)){ opt = {} }
				if(!obj_is(at.opt)){ at.opt = opt }
				if(text_is(tmp)){ tmp = [tmp] }
				if(list_is(tmp)){
					tmp = obj_map(tmp, function(url, i, map){
						i = {}; i.id = i.url = url; map(url, i);
					});
					if(!obj_is(at.opt.peers)){ at.opt.peers = {}}
					at.opt.peers = obj_to(tmp, at.opt.peers);
				}
				at.opt.peers = at.opt.peers || {};
				obj_to(opt, at.opt); // copies options on to `at.opt` only if not already taken.
				Gun.on('opt', at);
				at.opt.uuid = at.opt.uuid || function(){ return state_lex() + text_rand(12) }
				return gun;
			}
		}());

		var list_is = Gun.list.is;
		var text = Gun.text, text_is = text.is, text_rand = text.random;
		var obj = Gun.obj, obj_is = obj.is, obj_has = obj.has, obj_to = obj.to, obj_map = obj.map, obj_copy = obj.copy;
		var state_lex = Gun.state.lex, _soul = Gun.val.link._, _has = '.', node_ = Gun.node._, rel_is = Gun.val.link.is;
		var empty = {}, u;

		console.debug = function(i, s){ return (console.debug.i && i === console.debug.i && console.debug.i++) && (console.log.apply(console, arguments) || s) };

		Gun.log = function(){ return (!Gun.log.off && console.log.apply(console, arguments)), [].slice.call(arguments).join(' ') }
		Gun.log.once = function(w,s,o){ return (o = Gun.log.once)[w] = o[w] || 0, o[w]++ || Gun.log(s) }

		;"Please do not remove these messages unless you are paying for a monthly sponsorship, thanks!";
		Gun.log.once("welcome", "Hello wonderful person! :) Thanks for using GUN, feel free to ask for help on https://gitter.im/amark/gun and ask StackOverflow questions tagged with 'gun'!");
		;"Please do not remove these messages unless you are paying for a monthly sponsorship, thanks!";

		if(typeof window !== "undefined"){ (window.GUN = window.Gun = Gun).window = window }
		try{ if(typeof common !== "undefined"){ common.exports = Gun } }catch(e){}
		module.exports = Gun;

		/*Gun.on('opt', function(ctx){ // FOR TESTING PURPOSES
			this.to.next(ctx);
			if(ctx.once){ return }
			ctx.on('node', function(msg){
				var to = this.to;
				//Gun.node.is(msg.put, function(v,k){ msg.put[k] = v + v });
				setTimeout(function(){
					to.next(msg);
				},1);
			});
		});*/
	})(USE, './root');

	;USE(function(module){
		var Gun = USE('./root');
		Gun.chain.back = function(n, opt){ var tmp;
			n = n || 1;
			if(-1 === n || Infinity === n){
				return this._.root.$;
			} else
			if(1 === n){
				return (this._.back || this._).$;
			}
			var gun = this, at = gun._;
			if(typeof n === 'string'){
				n = n.split('.');
			}
			if(n instanceof Array){
				var i = 0, l = n.length, tmp = at;
				for(i; i < l; i++){
					tmp = (tmp||empty)[n[i]];
				}
				if(u !== tmp){
					return opt? gun : tmp;
				} else
				if((tmp = at.back)){
					return tmp.$.back(n, opt);
				}
				return;
			}
			if(n instanceof Function){
				var yes, tmp = {back: at};
				while((tmp = tmp.back)
				&& u === (yes = n(tmp, opt))){}
				return yes;
			}
			if(Gun.num.is(n)){
				return (at.back || at).$.back(n - 1);
			}
			return this;
		}
		var empty = {}, u;
	})(USE, './back');

	;USE(function(module){
		// WARNING: GUN is very simple, but the JavaScript chaining API around GUN
		// is complicated and was extremely hard to build. If you port GUN to another
		// language, consider implementing an easier API to build.
		var Gun = USE('./root');
		Gun.chain.chain = function(sub){
			var gun = this, at = gun._, chain = new (sub || gun).constructor(gun), cat = chain._, root;
			cat.root = root = at.root;
			cat.id = ++root.once;
			cat.back = gun._;
			cat.on = Gun.on;
			cat.on('in', input, cat); // For 'in' if I add my own listeners to each then I MUST do it before in gets called. If I listen globally for all incoming data instead though, regardless of individual listeners, I can transform the data there and then as well.
			cat.on('out', output, cat); // However for output, there isn't really the global option. I must listen by adding my own listener individually BEFORE this one is ever called.
			return chain;
		}

		function output(msg){
			var put, get, at = this.as, back = at.back, root = at.root, tmp;
			if(!msg.$){ msg.$ = at.$ }
			this.to.next(msg);
			if(get = msg.get){
				/*if(u !== at.put){
					at.on('in', at);
					return;
				}*/
				if(at.lex){ msg.get = obj_to(at.lex, msg.get) }
				if(get['#'] || at.soul){
					get['#'] = get['#'] || at.soul;
					msg['#'] || (msg['#'] = text_rand(9));
					back = (root.$.get(get['#'])._);
					if(!(get = get['.'])){
						tmp = back.ack;
						if(!tmp){ back.ack = -1 }
						if(obj_has(back, 'put')){
							back.on('in', back);
						}
						if(tmp){ return }
						msg.$ = back.$;
					} else
					if(obj_has(back.put, get)){ // TODO: support #LEX !
						put = (back.$.get(get)._);
						if(!(tmp = put.ack)){ put.ack = -1 }
						back.on('in', {
							$: back.$,
							put: Gun.state.to(back.put, get),
							get: back.get
						});
						if(tmp){ return }
					} else
					if('string' != typeof get){
						var put = {}, meta = (back.put||{})._;
						Gun.obj.map(back.put, function(v,k){
							if(!Gun.text.match(k, get)){ return }
							put[k] = v;
						})
						if(!Gun.obj.empty(put)){
							put._ = meta;
							back.on('in', {$: back.$, put: put, get: back.get})
						}
					}
					root.ask(ack, msg);
					return root.on('in', msg);
				}
				if(root.now){ root.now[at.id] = root.now[at.id] || true; at.pass = {} }
				if(get['.']){
					if(at.get){
						msg = {get: {'.': at.get}, $: at.$};
						//if(back.ask || (back.ask = {})[at.get]){ return }
						(back.ask || (back.ask = {}));
						back.ask[at.get] = msg.$._; // TODO: PERFORMANCE? More elegant way?
						return back.on('out', msg);
					}
					msg = {get: {}, $: at.$};
					return back.on('out', msg);
				}
				at.ack = at.ack || -1;
				if(at.get){
					msg.$ = at.$;
					get['.'] = at.get;
					(back.ask || (back.ask = {}))[at.get] = msg.$._; // TODO: PERFORMANCE? More elegant way?
					return back.on('out', msg);
				}
			}
			return back.on('out', msg);
		}

		function input(msg){
			var eve = this, cat = eve.as, root = cat.root, gun = msg.$, at = (gun||empty)._ || empty, change = msg.put, rel, tmp;
			if(cat.get && msg.get !== cat.get){
				msg = obj_to(msg, {get: cat.get});
			}
			if(cat.has && at !== cat){
				msg = obj_to(msg, {$: cat.$});
				if(at.ack){
					cat.ack = at.ack;
					//cat.ack = cat.ack || at.ack;
				}
			}
			if(u === change){
				tmp = at.put;
				eve.to.next(msg);
				if(cat.soul){ return } // TODO: BUG, I believee the fresh input refactor caught an edge case that a `gun.get('soul').get('key')` that points to a soul that doesn't exist will not trigger val/get etc.
				if(u === tmp && u !== at.put){ return }
				echo(cat, msg, eve);
				if(cat.has){
					not(cat, msg);
				}
				obj_del(at.echo, cat.id);
				obj_del(cat.map, at.id);
				return;
			}
			if(cat.soul){
				eve.to.next(msg);
				echo(cat, msg, eve);
				if(cat.next){ obj_map(change, map, {msg: msg, cat: cat}) }
				return;
			}
			if(!(rel = Gun.val.link.is(change))){
				if(Gun.val.is(change)){
					if(cat.has || cat.soul){
						not(cat, msg);
					} else
					if(at.has || at.soul){
						(at.echo || (at.echo = {}))[cat.id] = at.echo[at.id] || cat;
						(cat.map || (cat.map = {}))[at.id] = cat.map[at.id] || {at: at};
						//if(u === at.put){ return } // Not necessary but improves performance. If we have it but at does not, that means we got things out of order and at will get it. Once at gets it, it will tell us again.
					}
					eve.to.next(msg);
					echo(cat, msg, eve);
					return;
				}
				if(cat.has && at !== cat && obj_has(at, 'put')){
					cat.put = at.put;
				};
				if((rel = Gun.node.soul(change)) && at.has){
					at.put = (cat.root.$.get(rel)._).put;
				}
				tmp = (root.stop || {})[at.id];
				//if(tmp && tmp[cat.id]){ } else {
					eve.to.next(msg);
				//}
				relate(cat, msg, at, rel);
				echo(cat, msg, eve);
				if(cat.next){ obj_map(change, map, {msg: msg, cat: cat}) }
				return;
			}
			var was = root.stop;
			tmp = root.stop || {};
			tmp = tmp[at.id] || (tmp[at.id] = {});
			//if(tmp[cat.id]){ return }
			tmp.is = tmp.is || at.put;
			tmp[cat.id] = at.put || true;
			//if(root.stop){
				eve.to.next(msg)
			//}
			relate(cat, msg, at, rel);
			echo(cat, msg, eve);
		}

		function relate(at, msg, from, rel){
			if(!rel || node_ === at.get){ return }
			var tmp = (at.root.$.get(rel)._);
			if(at.has){
				from = tmp;
			} else
			if(from.has){
				relate(from, msg, from, rel);
			}
			if(from === at){ return }
			if(!from.$){ from = {} }
			(from.echo || (from.echo = {}))[at.id] = from.echo[at.id] || at;
			if(at.has && !(at.map||empty)[from.id]){ // if we haven't seen this before.
				not(at, msg);
			}
			tmp = from.id? ((at.map || (at.map = {}))[from.id] = at.map[from.id] || {at: from}) : {};
			if(rel === tmp.link){
				if(!(tmp.pass || at.pass)){
					return;
				}
			}
			if(at.pass){
				Gun.obj.map(at.map, function(tmp){ tmp.pass = true })
				obj_del(at, 'pass');
			}
			if(tmp.pass){ obj_del(tmp, 'pass') }
			if(at.has){ at.link = rel }
			ask(at, tmp.link = rel);
		}
		function echo(at, msg, ev){
			if(!at.echo){ return } // || node_ === at.get ?
			//if(at.has){ msg = obj_to(msg, {event: ev}) }
			obj_map(at.echo, reverb, msg);
		}
		function reverb(to){
			if(!to || !to.on){ return }
			to.on('in', this);
		}
		function map(data, key){ // Map over only the changes on every update.
			var cat = this.cat, next = cat.next || empty, via = this.msg, chain, at, tmp;
			if(node_ === key && !next[key]){ return }
			if(!(at = next[key])){
				return;
			}
			//if(data && data[_soul] && (tmp = Gun.val.link.is(data)) && (tmp = (cat.root.$.get(tmp)._)) && obj_has(tmp, 'put')){
			//	data = tmp.put;
			//}
			if(at.has){
				//if(!(data && data[_soul] && Gun.val.link.is(data) === Gun.node.soul(at.put))){
				if(u === at.put || !Gun.val.link.is(data)){
					at.put = data;
				}
				chain = at.$;
			} else
			if(tmp = via.$){
				tmp = (chain = via.$.get(key))._;
				if(u === tmp.put || !Gun.val.link.is(data)){
					tmp.put = data;
				}
			}
			at.on('in', {
				put: data,
				get: key,
				$: chain,
				via: via
			});
		}
		function not(at, msg){
			if(!(at.has || at.soul)){ return }
			var tmp = at.map, root = at.root;
			at.map = null;
			if(at.has){
				if(at.dub && at.root.stop){ at.dub = null }
				at.link = null;
			}
			//if(!root.now || !root.now[at.id]){
			if(!at.pass){
				if((!msg['@']) && null === tmp){ return }
				//obj_del(at, 'pass');
			}
			if(u === tmp && Gun.val.link.is(at.put)){ return } // This prevents the very first call of a thing from triggering a "clean up" call. // TODO: link.is(at.put) || !val.is(at.put) ?
			obj_map(tmp, function(proxy){
				if(!(proxy = proxy.at)){ return }
				obj_del(proxy.echo, at.id);
			});
			tmp = at.put;
			obj_map(at.next, function(neat, key){
				if(u === tmp && u !== at.put){ return true }
				neat.put = u;
				if(neat.ack){
					neat.ack = -1; // TODO: BUG? Should this be 0?
				}
				neat.on('in', {
					get: key,
					$: neat.$,
					put: u
				});
			});
		}
		function ask(at, soul){
			var tmp = (at.root.$.get(soul)._), lex = at.lex;
			if(at.ack || lex){
				(lex = lex||{})['#'] = soul;
				tmp.on('out', {get: lex});
				if(!at.ask){ return } // TODO: PERFORMANCE? More elegant way?
			}
			tmp = at.ask; Gun.obj.del(at, 'ask');
			obj_map(tmp || at.next, function(neat, key){
				var lex = neat.lex || {}; lex['#'] = soul; lex['.'] = lex['.'] || key;
				neat.on('out', {get: lex});
			});
			Gun.obj.del(at, 'ask'); // TODO: PERFORMANCE? More elegant way?
		}
		function ack(msg, ev){
			var as = this.as, get = as.get || empty, at = as.$._, tmp = (msg.put||empty)[get['#']];
			if(at.ack){ at.ack = (at.ack + 1) || 1; }
			if(!msg.put || ('string' == typeof get['.'] && !obj_has(tmp, at.get))){
				if(at.put !== u){ return }
				at.on('in', {
					get: at.get,
					put: at.put = u,
					$: at.$,
					'@': msg['@']
				});
				return;
			}
			if(node_ == get['.']){ // is this a security concern?
				at.on('in', {get: at.get, put: Gun.val.link.ify(get['#']), $: at.$, '@': msg['@']});
				return;
			}
			Gun.on.put(msg, at.root.$);
		}
		var empty = {}, u;
		var obj = Gun.obj, obj_has = obj.has, obj_put = obj.put, obj_del = obj.del, obj_to = obj.to, obj_map = obj.map;
		var text_rand = Gun.text.random;
		var _soul = Gun.val.link._, node_ = Gun.node._;
	})(USE, './chain');

	;USE(function(module){
		var Gun = USE('./root');
		Gun.chain.get = function(key, cb, as){
			var gun, tmp;
			if(typeof key === 'string'){
				var back = this, cat = back._;
				var next = cat.next || empty;
				if(!(gun = next[key])){
					gun = cache(key, back);
				}
				gun = gun.$;
			} else
			if(key instanceof Function){
				if(true === cb){ return soul(this, key, cb, as) }
				gun = this;
				var at = gun._, root = at.root, tmp = root.now, ev;
				as = cb || {};
				as.at = at;
				as.use = key;
				as.out = as.out || {};
				as.out.get = as.out.get || {};
				(ev = at.on('in', use, as)).rid = rid;
				(root.now = {$:1})[as.now = at.id] = ev;
				var mum = root.mum; root.mum = {};
				at.on('out', as.out);
				root.mum = mum;
				root.now = tmp;
				return gun;
			} else
			if(num_is(key)){
				return this.get(''+key, cb, as);
			} else
			if(tmp = rel.is(key)){
				return this.get(tmp, cb, as);
			} else
			if(obj.is(key)){
				gun = this;
				if(tmp = ((tmp = key['#'])||empty)['='] || tmp){ gun = gun.get(tmp) }
				gun._.lex = key;
				return gun;
			} else {
				(as = this.chain())._.err = {err: Gun.log('Invalid get request!', key)}; // CLEAN UP
				if(cb){ cb.call(as, as._.err) }
				return as;
			}
			if(tmp = this._.stun){ // TODO: Refactor?
				gun._.stun = gun._.stun || tmp;
			}
			if(cb && cb instanceof Function){
				gun.get(cb, as);
			}
			return gun;
		}
		function cache(key, back){
			var cat = back._, next = cat.next, gun = back.chain(), at = gun._;
			if(!next){ next = cat.next = {} }
			next[at.get = key] = at;
			if(back === cat.root.$){
				at.soul = key;
			} else
			if(cat.soul || cat.has){
				at.has = key;
				//if(obj_has(cat.put, key)){
					//at.put = cat.put[key];
				//}
			}
			return at;
		}
		function soul(gun, cb, opt, as){
			var cat = gun._, acks = 0, tmp;
			if(tmp = cat.soul || cat.link || cat.dub){ return cb(tmp, as, cat), gun }
			gun.get(function(msg, ev){
				if(u === msg.put && (tmp = (obj_map(cat.root.opt.peers, function(v,k,t){t(k)})||[]).length) && ++acks < tmp){
					return;
				}
				ev.rid(msg);
				var at = ((at = msg.$) && at._) || {};
				tmp = at.link || at.soul || rel.is(msg.put) || node_soul(msg.put) || at.dub;
				cb(tmp, as, msg, ev);
			}, {out: {get: {'.':true}}});
			return gun;
		}
		function use(msg){
			var eve = this, as = eve.as, cat = as.at, root = cat.root, gun = msg.$, at = (gun||{})._ || {}, data = msg.put || at.put, tmp;
			if((tmp = root.now) && eve !== tmp[as.now]){ return eve.to.next(msg) }
			//console.log("USE:", cat.id, cat.soul, cat.has, cat.get, msg, root.mum);
			//if(at.async && msg.root){ return }
			//if(at.async === 1 && cat.async !== true){ return }
			//if(root.stop && root.stop[at.id]){ return } root.stop && (root.stop[at.id] = true);
			//if(!at.async && !cat.async && at.put && msg.put === at.put){ return }
			//else if(!cat.async && msg.put !== at.put && root.stop && root.stop[at.id]){ return } root.stop && (root.stop[at.id] = true);


			//root.stop && (root.stop.id = root.stop.id || Gun.text.random(2));
			//if((tmp = root.stop) && (tmp = tmp[at.id] || (tmp[at.id] = {})) && tmp[cat.id]){ return } tmp && (tmp[cat.id] = true);
			if(eve.seen && at.id && eve.seen[at.id]){ return eve.to.next(msg) }
			//if((tmp = root.stop)){ if(tmp[at.id]){ return } tmp[at.id] = msg.root; } // temporary fix till a better solution?
			if((tmp = data) && tmp[rel._] && (tmp = rel.is(tmp))){
				tmp = ((msg.$$ = at.root.gun.get(tmp))._);
				if(u !== tmp.put){
					msg = obj_to(msg, {put: data = tmp.put});
				}
			}
			if((tmp = root.mum) && at.id){ // TODO: can we delete mum entirely now?
				var id = at.id + (eve.id || (eve.id = Gun.text.random(9)));
				if(tmp[id]){ return }
				if(u !== data && !rel.is(data)){ tmp[id] = true; }
			}
			as.use(msg, eve);
			if(eve.stun){
				eve.stun = null;
				return;
			}
			eve.to.next(msg);
		}
		function rid(at){
			var cat = this.on;
			if(!at || cat.soul || cat.has){ return this.off() }
			if(!(at = (at = (at = at.$ || at)._ || at).id)){ return }
			var map = cat.map, tmp, seen;
			//if(!map || !(tmp = map[at]) || !(tmp = tmp.at)){ return }
			if(tmp = (seen = this.seen || (this.seen = {}))[at]){ return true }
			seen[at] = true;
			return;
			//tmp.echo[cat.id] = {}; // TODO: Warning: This unsubscribes ALL of this chain's listeners from this link, not just the one callback event.
			//obj.del(map, at); // TODO: Warning: This unsubscribes ALL of this chain's listeners from this link, not just the one callback event.
			return;
		}
		var obj = Gun.obj, obj_map = obj.map, obj_has = obj.has, obj_to = Gun.obj.to;
		var num_is = Gun.num.is;
		var rel = Gun.val.link, node_soul = Gun.node.soul, node_ = Gun.node._;
		var empty = {}, u;
	})(USE, './get');

	;USE(function(module){
		var Gun = USE('./root');
		Gun.chain.put = function(data, cb, as){
			// #soul.has=value>state
			// ~who#where.where=what>when@was
			// TODO: BUG! Put probably cannot handle plural chains!
			var gun = this, at = (gun._), root = at.root.$, ctx = root._, M = 100, tmp;
			if(!ctx.puta){ if(tmp = ctx.puts){ if(tmp > M){ // without this, when synchronous, writes to a 'not found' pile up, when 'not found' resolves it recursively calls `put` which incrementally resolves each write. Stack overflow limits can be as low as 10K, so this limit is hardcoded to 1% of 10K.
				(ctx.stack || (ctx.stack = [])).push([gun, data, cb, as]);
				if(ctx.puto){ return }
				ctx.puto = setTimeout(function drain(){
					var d = ctx.stack.splice(0,M), i = 0, at; ctx.puta = true;
					while(at = d[i++]){ at[0].put(at[1], at[2], at[3]) } delete ctx.puta;
					if(ctx.stack.length){ return ctx.puto = setTimeout(drain, 0) }
					ctx.stack = ctx.puts = ctx.puto = null;
				}, 0);
				return gun;
			} ++ctx.puts } else { ctx.puts = 1 } }
			as = as || {};
			as.data = data;
			as.via = as.$ = as.via || as.$ || gun;
			if(typeof cb === 'string'){
				as.soul = cb;
			} else {
				as.ack = as.ack || cb;
			}
			if(at.soul){
				as.soul = at.soul;
			}
			if(as.soul || root === gun){
				if(!obj_is(as.data)){
					(as.ack||noop).call(as, as.out = {err: Gun.log("Data saved to the root level of the graph must be a node (an object), not a", (typeof as.data), 'of "' + as.data + '"!')});
					if(as.res){ as.res() }
					return gun;
				}
				as.soul = as.soul || (as.not = Gun.node.soul(as.data) || (as.via.back('opt.uuid') || Gun.text.random)());
				if(!as.soul){ // polyfill async uuid for SEA
					as.via.back('opt.uuid')(function(err, soul){ // TODO: improve perf without anonymous callback
						if(err){ return Gun.log(err) } // TODO: Handle error!
						(as.ref||as.$).put(as.data, as.soul = soul, as);
					});
					return gun;
				}
				as.$ = root.get(as.soul);
				as.ref = as.$;
				ify(as);
				return gun;
			}
			if(Gun.is(data)){
				data.get(function(soul, o, msg){
					if(!soul){
						return Gun.log("The reference you are saving is a", typeof msg.put, '"'+ msg.put +'", not a node (object)!');
					}
					gun.put(Gun.val.link.ify(soul), cb, as);
				}, true);
				return gun;
			}
			if(at.has && (tmp = Gun.val.link.is(data))){ at.dub = tmp }
			as.ref = as.ref || (root._ === (tmp = at.back))? gun : tmp.$;
			if(as.ref._.soul && Gun.val.is(as.data) && at.get){
				as.data = obj_put({}, at.get, as.data);
				as.ref.put(as.data, as.soul, as);
				return gun;
			}
			as.ref.get(any, true, {as: as});
			if(!as.out){
				// TODO: Perf idea! Make a global lock, that blocks everything while it is on, but if it is on the lock it does the expensive lookup to see if it is a dependent write or not and if not then it proceeds full speed. Meh? For write heavy async apps that would be terrible.
				as.res = as.res || stun; // Gun.on.stun(as.ref); // TODO: BUG! Deal with locking?
				as.$._.stun = as.ref._.stun;
			}
			return gun;
		};

		function ify(as){
			as.batch = batch;
			var opt = as.opt||{}, env = as.env = Gun.state.map(map, opt.state);
			env.soul = as.soul;
			as.graph = Gun.graph.ify(as.data, env, as);
			if(env.err){
				(as.ack||noop).call(as, as.out = {err: Gun.log(env.err)});
				if(as.res){ as.res() }
				return;
			}
			as.batch();
		}

		function stun(cb){
			if(cb){ cb() }
			return;
			var as = this;
			if(!as.ref){ return }
			if(cb){
				as.after = as.ref._.tag;
				as.now = as.ref._.tag = {};
				cb();
				return;
			}
			if(as.after){
				as.ref._.tag = as.after;
			}
		}

		function batch(){ var as = this;
			if(!as.graph || obj_map(as.stun, no)){ return }
			as.res = as.res || function(cb){ if(cb){ cb() } };
			as.res(function(){
				var cat = (as.$.back(-1)._), ask = cat.ask(function(ack){
					cat.root.on('ack', ack);
					if(ack.err){ Gun.log(ack) }
					if(++acks > (as.acks || 0)){ this.off() } // Adjustable ACKs! Only 1 by default.
					if(!as.ack){ return }
					as.ack(ack, this);
					//--C;
				}, as.opt), acks = 0;
				//C++;
				// NOW is a hack to get synchronous replies to correctly call.
				// and STOP is a hack to get async behavior to correctly call.
				// neither of these are ideal, need to be fixed without hacks,
				// but for now, this works for current tests. :/
				var tmp = cat.root.now; obj.del(cat.root, 'now');
				var mum = cat.root.mum; cat.root.mum = {};
				(as.ref._).on('out', {
					$: as.ref, put: as.out = as.env.graph, opt: as.opt, '#': ask
				});
				cat.root.mum = mum? obj.to(mum, cat.root.mum) : mum;
				cat.root.now = tmp;
			}, as);
			if(as.res){ as.res() }
		} function no(v,k){ if(v){ return true } }
		//console.debug(999,1); var C = 0; setInterval(function(){ try{ debug.innerHTML = C }catch(e){console.log(e)} }, 500);

		function map(v,k,n, at){ var as = this;
			var is = Gun.is(v);
			if(k || !at.path.length){ return }
			(as.res||iife)(function(){
				var path = at.path, ref = as.ref, opt = as.opt;
				var i = 0, l = path.length;
				for(i; i < l; i++){
					ref = ref.get(path[i]);
				}
				if(is){ ref = v }
				var id = (ref._).dub;
				if(id || (id = Gun.node.soul(at.obj))){
					ref.back(-1).get(id);
					at.soul(id);
					return;
				}
				(as.stun = as.stun || {})[path] = true;
				ref.get(soul, true, {as: {at: at, as: as, p:path}});
			}, {as: as, at: at});
			//if(is){ return {} }
		}

		function soul(id, as, msg, eve){
			var as = as.as, cat = as.at; as = as.as;
			var at = ((msg || {}).$ || {})._ || {};
			id = at.dub = at.dub || id || Gun.node.soul(cat.obj) || Gun.node.soul(msg.put || at.put) || Gun.val.link.is(msg.put || at.put) || (as.via.back('opt.uuid') || Gun.text.random)(); // TODO: BUG!? Do we really want the soul of the object given to us? Could that be dangerous?
			if(eve){ eve.stun = true }
			if(!id){ // polyfill async uuid for SEA
				at.via.back('opt.uuid')(function(err, id){ // TODO: improve perf without anonymous callback
					if(err){ return Gun.log(err) } // TODO: Handle error.
					solve(at, at.dub = at.dub || id, cat, as);
				});
				return;
			}
			solve(at, at.dub = id, cat, as);
		}

		function solve(at, id, cat, as){
			at.$.back(-1).get(id);
			cat.soul(id);
			as.stun[cat.path] = false;
			as.batch();
		}

		function any(soul, as, msg, eve){
			as = as.as;
			if(!msg.$ || !msg.$._){ return } // TODO: Handle
			if(msg.err){ // TODO: Handle
				console.log("Please report this as an issue! Put.any.err");
				return;
			}
			var at = (msg.$._), data = at.put, opt = as.opt||{}, root, tmp;
			if((tmp = as.ref) && tmp._.now){ return }
			if(eve){ eve.stun = true }
			if(as.ref !== as.$){
				tmp = (as.$._).get || at.get;
				if(!tmp){ // TODO: Handle
					console.log("Please report this as an issue! Put.no.get"); // TODO: BUG!??
					return;
				}
				as.data = obj_put({}, tmp, as.data);
				tmp = null;
			}
			if(u === data){
				if(!at.get){ return } // TODO: Handle
				if(!soul){
					tmp = at.$.back(function(at){
						if(at.link || at.soul){ return at.link || at.soul }
						as.data = obj_put({}, at.get, as.data);
					});
				}
				tmp = tmp || at.soul || at.link || at.dub;// || at.get;
				at = tmp? (at.root.$.get(tmp)._) : at;
				as.soul = tmp;
				data = as.data;
			}
			if(!as.not && !(as.soul = as.soul || soul)){
				if(as.path && obj_is(as.data)){
					as.soul = (opt.uuid || as.via.back('opt.uuid') || Gun.text.random)();
				} else {
					//as.data = obj_put({}, as.$._.get, as.data);
					if(node_ == at.get){
						as.soul = (at.put||empty)['#'] || at.dub;
					}
					as.soul = as.soul || at.soul || at.link || (opt.uuid || as.via.back('opt.uuid') || Gun.text.random)();
				}
				if(!as.soul){ // polyfill async uuid for SEA
					as.via.back('opt.uuid')(function(err, soul){ // TODO: improve perf without anonymous callback
						if(err){ return Gun.log(err) } // Handle error.
						as.ref.put(as.data, as.soul = soul, as);
					});
					return;
				}
			}
			as.ref.put(as.data, as.soul, as);
		}
		var obj = Gun.obj, obj_is = obj.is, obj_put = obj.put, obj_map = obj.map;
		var u, empty = {}, noop = function(){}, iife = function(fn,as){fn.call(as||empty)};
		var node_ = Gun.node._;
	})(USE, './put');

	;USE(function(module){
		var Gun = USE('./root');
		USE('./chain');
		USE('./back');
		USE('./put');
		USE('./get');
		module.exports = Gun;
	})(USE, './index');

	;USE(function(module){
		var Gun = USE('./index');
		Gun.chain.on = function(tag, arg, eas, as){
			var gun = this, at = gun._, tmp, act, off;
			if(typeof tag === 'string'){
				if(!arg){ return at.on(tag) }
				act = at.on(tag, arg, eas || at, as);
				if(eas && eas.$){
					(eas.subs || (eas.subs = [])).push(act);
				}
				return gun;
			}
			var opt = arg;
			opt = (true === opt)? {change: true} : opt || {};
			opt.at = at;
			opt.ok = tag;
			//opt.last = {};
			gun.get(ok, opt); // TODO: PERF! Event listener leak!!!?
			return gun;
		}

		function ok(msg, ev){ var opt = this;
			var gun = msg.$, at = (gun||{})._ || {}, data = at.put || msg.put, cat = opt.at, tmp;
			if(u === data){
				return;
			}
			if(tmp = msg.$$){
				tmp = (msg.$$._);
				if(u === tmp.put){
					return;
				}
				data = tmp.put;
			}
			if(opt.change){ // TODO: BUG? Move above the undef checks?
				data = msg.put;
			}
			// DEDUPLICATE // TODO: NEEDS WORK! BAD PROTOTYPE
			//if(tmp.put === data && tmp.get === id && !Gun.node.soul(data)){ return }
			//tmp.put = data;
			//tmp.get = id;
			// DEDUPLICATE // TODO: NEEDS WORK! BAD PROTOTYPE
			//at.last = data;
			if(opt.as){
				opt.ok.call(opt.as, msg, ev);
			} else {
				opt.ok.call(gun, data, msg.get, msg, ev);
			}
		}

		Gun.chain.val = function(cb, opt){
			Gun.log.once("onceval", "Future Breaking API Change: .val -> .once, apologies unexpected.");
			return this.once(cb, opt);
		}
		Gun.chain.once = function(cb, opt){
			var gun = this, at = gun._, data = at.put;
			if(0 < at.ack && u !== data){
				(cb || noop).call(gun, data, at.get);
				return gun;
			}
			if(cb){
				(opt = opt || {}).ok = cb;
				opt.at = at;
				opt.out = {'#': Gun.text.random(9)};
				gun.get(val, {as: opt});
				opt.async = true; //opt.async = at.stun? 1 : true;
			} else {
				Gun.log.once("valonce", "Chainable val is experimental, its behavior and API may change moving forward. Please play with it and report bugs and ideas on how to improve it.");
				var chain = gun.chain();
				chain._.nix = gun.once(function(){
					chain._.on('in', gun._);
				});
				return chain;
			}
			return gun;
		}

		function val(msg, eve, to){
			if(!msg.$){ eve.off(); return }
			var opt = this.as, cat = opt.at, gun = msg.$, at = gun._, data = at.put || msg.put, link, tmp;
			if(tmp = msg.$$){
				link = tmp = (msg.$$._);
				if(u !== link.put){
					data = link.put;
				}
			}
			if((tmp = eve.wait) && (tmp = tmp[at.id])){ clearTimeout(tmp) }
			if((!to && (u === data || at.soul || at.link || (link && !(0 < link.ack))))
			|| (u === data && (tmp = (obj_map(at.root.opt.peers, function(v,k,t){t(k)})||[]).length) && (!to && (link||at).ack <= tmp))){
				tmp = (eve.wait = {})[at.id] = setTimeout(function(){
					val.call({as:opt}, msg, eve, tmp || 1);
				}, opt.wait || 99);
				return;
			}
			if(link && u === link.put && (tmp = rel.is(data))){ data = Gun.node.ify({}, tmp) }
			eve.rid(msg);
			opt.ok.call(gun || opt.$, data, msg.get);
		}

		Gun.chain.off = function(){
			// make off more aggressive. Warning, it might backfire!
			var gun = this, at = gun._, tmp;
			var cat = at.back;
			if(!cat){ return }
			at.ack = 0; // so can resubscribe.
			if(tmp = cat.next){
				if(tmp[at.get]){
					obj_del(tmp, at.get);
				} else {

				}
			}
			if(tmp = cat.ask){
				obj_del(tmp, at.get);
			}
			if(tmp = cat.put){
				obj_del(tmp, at.get);
			}
			if(tmp = at.soul){
				obj_del(cat.root.graph, tmp);
			}
			if(tmp = at.map){
				obj_map(tmp, function(at){
					if(at.link){
						cat.root.$.get(at.link).off();
					}
				});
			}
			if(tmp = at.next){
				obj_map(tmp, function(neat){
					neat.$.off();
				});
			}
			at.on('off', {});
			return gun;
		}
		var obj = Gun.obj, obj_map = obj.map, obj_has = obj.has, obj_del = obj.del, obj_to = obj.to;
		var rel = Gun.val.link;
		var empty = {}, noop = function(){}, u;
	})(USE, './on');

	;USE(function(module){
		var Gun = USE('./index');
		Gun.chain.map = function(cb, opt, t){
			var gun = this, cat = gun._, chain;
			if(!cb){
				if(chain = cat.each){ return chain }
				cat.each = chain = gun.chain();
				chain._.nix = gun.back('nix');
				gun.on('in', map, chain._);
				return chain;
			}
			Gun.log.once("mapfn", "Map functions are experimental, their behavior and API may change moving forward. Please play with it and report bugs and ideas on how to improve it.");
			chain = gun.chain();
			gun.map().on(function(data, key, at, ev){
				var next = (cb||noop).call(this, data, key, at, ev);
				if(u === next){ return }
				if(data === next){ return chain._.on('in', at) }
				if(Gun.is(next)){ return chain._.on('in', next._) }
				chain._.on('in', {get: key, put: next});
			});
			return chain;
		}
		function map(msg){
			if(!msg.put || Gun.val.is(msg.put)){ return this.to.next(msg) }
			if(this.as.nix){ this.off() } // TODO: Ugly hack!
			obj_map(msg.put, each, {at: this.as, msg: msg});
			this.to.next(msg);
		}
		function each(v,k){
			if(n_ === k){ return }
			var msg = this.msg, gun = msg.$, at = gun._, cat = this.at, tmp = at.lex;
			if(tmp && !Gun.text.match(k, tmp['.'] || tmp['#'] || tmp)){ return } // review?
			((tmp = gun.get(k)._).echo || (tmp.echo = {}))[cat.id] = tmp.echo[cat.id] || cat;
		}
		var obj_map = Gun.obj.map, noop = function(){}, event = {stun: noop, off: noop}, n_ = Gun.node._, u;
	})(USE, './map');

	;USE(function(module){
		var Gun = USE('./index');
		Gun.chain.set = function(item, cb, opt){
			var gun = this, soul;
			cb = cb || function(){};
			opt = opt || {}; opt.item = opt.item || item;
			if(soul = Gun.node.soul(item)){ item = Gun.obj.put({}, soul, Gun.val.link.ify(soul)) }
			if(!Gun.is(item)){
				if(Gun.obj.is(item)){;
					item = gun.back(-1).get(soul = soul || Gun.node.soul(item) || gun.back('opt.uuid')()).put(item);
				}
				return gun.get(soul || (Gun.state.lex() + Gun.text.random(7))).put(item, cb, opt);
			}
			item.get(function(soul, o, msg){
				if(!soul){ return cb.call(gun, {err: Gun.log('Only a node can be linked! Not "' + msg.put + '"!')}) }
				gun.put(Gun.obj.put({}, soul, Gun.val.link.ify(soul)), cb, opt);
			},true);
			return item;
		}
	})(USE, './set');

	;USE(function(module){
		if(typeof Gun === 'undefined'){ return } // TODO: localStorage is Browser only. But it would be nice if it could somehow plugin into NodeJS compatible localStorage APIs?

		var root, noop = function(){}, store, u;
		try{store = (Gun.window||noop).localStorage}catch(e){}
		if(!store){
			console.log("Warning: No localStorage exists to persist data to!");
			store = {setItem: function(k,v){this[k]=v}, removeItem: function(k){delete this[k]}, getItem: function(k){return this[k]}};
		}
		/*
			NOTE: Both `lib/file.js` and `lib/memdisk.js` are based on this design!
			If you update anything here, consider updating the other adapters as well.
		*/

		Gun.on('create', function(root){
			// This code is used to queue offline writes for resync.
			// See the next 'opt' code below for actual saving of data.
			var ev = this.to, opt = root.opt;
			if(root.once){ return ev.next(root) }
			//if(false === opt.localStorage){ return ev.next(root) } // we want offline resynce queue regardless!
			opt.prefix = opt.file || 'gun/';
			var gap = Gun.obj.ify(store.getItem('gap/'+opt.prefix)) || {};
			var empty = Gun.obj.empty, id, to, go;
			// add re-sync command.
			if(!empty(gap)){
				var disk = Gun.obj.ify(store.getItem(opt.prefix)) || {}, send = {};
				Gun.obj.map(gap, function(node, soul){
					Gun.obj.map(node, function(val, key){
						send[soul] = Gun.state.to(disk[soul], key, send[soul]);
					});
				});
				setTimeout(function(){
					// TODO: Holy Grail dangling by this thread! If gap / offline resync doesn't trigger, it doesn't work. Ouch, and this is a localStorage specific adapter. :(
					root.on('out', {put: send, '#': root.ask(ack)});
				},1);
			}

			root.on('out', function(msg){
				if(msg.lS){ return } // TODO: for IndexedDB and others, shouldn't send to peers ACKs to our own GETs.
				if(Gun.is(msg.$) && msg.put && !msg['@']){
					id = msg['#'];
					Gun.graph.is(msg.put, null, map);
					if(!to){ to = setTimeout(flush, opt.wait || 1) }
				}
				this.to.next(msg);
			});
			root.on('ack', ack);

			function ack(ack){ // TODO: This is experimental, not sure if we should keep this type of event hook.
				if(ack.err || !ack.ok){ return }
				var id = ack['@'];
				setTimeout(function(){
					Gun.obj.map(gap, function(node, soul){
						Gun.obj.map(node, function(val, key){
							if(id !== val){ return }
							delete node[key];
						});
						if(empty(node)){
							delete gap[soul];
						}
					});
					flush();
				}, opt.wait || 1);
			};
			ev.next(root);

			var map = function(val, key, node, soul){
				(gap[soul] || (gap[soul] = {}))[key] = id;
			}
			var flush = function(){
				clearTimeout(to);
				to = false;
				try{store.setItem('gap/'+opt.prefix, JSON.stringify(gap));
				}catch(e){ Gun.log(err = e || "localStorage failure") }
			}
		});

		Gun.on('create', function(root){
			this.to.next(root);
			var opt = root.opt;
			if(root.once){ return }
			if(false === opt.localStorage){ return }
			opt.prefix = opt.file || 'gun/';
			var graph = root.graph, acks = {}, count = 0, to;
			var disk = Gun.obj.ify(store.getItem(opt.prefix)) || {};
			var lS = function(){}, u;
			root.on('localStorage', disk); // NON-STANDARD EVENT!

			root.on('put', function(at){
				this.to.next(at);
				Gun.graph.is(at.put, null, map);
				if(!at['@']){ acks[at['#']] = true; } // only ack non-acks.
				count += 1;
				if(count >= (opt.batch || 1000)){
					return flush();
				}
				if(to){ return }
				to = setTimeout(flush, opt.wait || 1);
			});

			root.on('get', function(msg){
				this.to.next(msg);
				var lex = msg.get, soul, data, u;
				function to(){
				if(!lex || !(soul = lex['#'])){ return }
				//if(0 >= msg.cap){ return }
				var has = lex['.'];
				data = disk[soul] || u;
				if(data && has){
					data = Gun.state.to(data, has);
				}
				//if(!data && !Gun.obj.empty(opt.peers)){ return } // if data not found, don't ack if there are peers. // Hmm, what if we have peers but we are disconnected?
				//console.log("lS get", lex, data);
				root.on('in', {'@': msg['#'], put: Gun.graph.node(data), how: 'lS', lS: msg.$});// || root.$});
				};
				Gun.debug? setTimeout(to,1) : to();
			});

			var map = function(val, key, node, soul){
				disk[soul] = Gun.state.to(node, key, disk[soul]);
			}

			var flush = function(data){
				var err;
				count = 0;
				clearTimeout(to);
				to = false;
				var ack = acks;
				acks = {};
				if(data){ disk = data }
				try{store.setItem(opt.prefix, JSON.stringify(disk));
				}catch(e){
					Gun.log(err = (e || "localStorage failure") + " Consider using GUN's IndexedDB plugin for RAD for more storage space, temporary example at https://github.com/amark/gun/blob/master/test/tmp/indexedDB.html .");
					root.on('localStorage:error', {err: err, file: opt.prefix, flush: disk, retry: flush});
				}
				if(!err && !Gun.obj.empty(opt.peers)){ return } // only ack if there are no peers.
				Gun.obj.map(ack, function(yes, id){
					root.on('in', {
						'@': id,
						err: err,
						ok: 0 // localStorage isn't reliable, so make its `ok` code be a low number.
					});
				});
			}
		});
	})(USE, './adapters/localStorage');

	;USE(function(module){
		var Type = USE('../type');

		function Mesh(root){
			var mesh = function(){};
			var opt = root.opt || {};
			opt.log = opt.log || console.log;
			opt.gap = opt.gap || opt.wait || 1;
			opt.pack = opt.pack || (opt.memory? (opt.memory * 1000 * 1000) : 1399000000) * 0.3; // max_old_space_size defaults to 1400 MB.

			var dup = root.dup;

			mesh.hear = function(raw, peer){
				if(!raw){ return }
				var msg, id, hash, tmp = raw[0];
				if(opt.pack <= raw.length){ return mesh.say({dam: '!', err: "Message too big!"}, peer) }
				if('{' != raw[2]){ mesh.hear.d += raw.length||0; ++mesh.hear.c; } // STATS! // ugh, stupid double JSON encoding
				if('[' === tmp){
					try{msg = JSON.parse(raw);}catch(e){opt.log('DAM JSON parse error', e)}
					if(!msg){ return }
					var i = 0, m;
					while(m = msg[i++]){
						mesh.hear(m, peer);
					}
					return;
				}
				if('{' === tmp || (Type.obj.is(raw) && (msg = raw))){
					try{msg = msg || JSON.parse(raw);
					}catch(e){return opt.log('DAM JSON parse error', e)}
					if(!msg){ return }
					if(!(id = msg['#'])){ id = msg['#'] = Type.text.random(9) }
					if(dup.check(id)){ return }
					dup.track(id, true).it = msg; // GUN core also dedups, so `true` is needed. // Does GUN core need to dedup anymore?
					if(!(hash = msg['##']) && u !== msg.put){ hash = msg['##'] = Type.obj.hash(msg.put) }
					if(hash && (tmp = msg['@'] || (msg.get && id))){ // Reduces backward daisy in case varying hashes at different daisy depths are the same.
						if(dup.check(tmp+hash)){ return }
						dup.track(tmp+hash, true).it = msg; // GUN core also dedups, so `true` is needed. // Does GUN core need to dedup anymore?
					}
					(msg._ = function(){}).via = peer;
					if(tmp = msg['><']){ (msg._).to = Type.obj.map(tmp.split(','), tomap) }
					if(msg.dam){
						if(tmp = mesh.hear[msg.dam]){
							tmp(msg, peer, root);
						}
						return;
					}
					root.on('in', msg);
					return;
				}
			}
			var tomap = function(k,i,m){m(k,true)};
			mesh.hear.c = mesh.hear.d = 0;

			;(function(){
				var message;
				function each(peer){ mesh.say(message, peer) }
				mesh.say = function(msg, peer){
					if(this.to){ this.to.next(msg) } // compatible with middleware adapters.
					if(!msg){ return false }
					var id, hash, tmp, raw;
					var meta = msg._||(msg._=function(){});
					if(!(id = msg['#'])){ id = msg['#'] = Type.text.random(9) }
					if(!(hash = msg['##']) && u !== msg.put){ hash = msg['##'] = Type.obj.hash(msg.put) }
					if(!(raw = meta.raw)){
						raw = meta.raw = mesh.raw(msg);
						if(hash && (tmp = msg['@'])){
							dup.track(tmp+hash).it = msg;
							if(tmp = (dup.s[tmp]||ok).it){
								if(hash === tmp['##']){ return false }
								tmp['##'] = hash;
							}
						}
					}
					dup.track(id).it = msg; // track for 9 seconds, default. Earth<->Mars would need more!
					if(!peer){ peer = (tmp = dup.s[msg['@']]) && (tmp = tmp.it) && (tmp = tmp._) && (tmp = tmp.via) }
					if(!peer && mesh.way){ return mesh.way(msg) }
					if(!peer || !peer.id){ message = msg;
						if(!Type.obj.is(peer || opt.peers)){ return false }
						Type.obj.map(peer || opt.peers, each); // in case peer is a peer list.
						return;
					}
					if(!peer.wire && mesh.wire){ mesh.wire(peer) }
					if(peer === meta.via){ return false }
					if((tmp = meta.to) && (tmp[peer.url] || tmp[peer.pid] || tmp[peer.id]) /*&& !o*/){ return false }
					if(peer.batch){
						peer.tail = (tmp = peer.tail || 0) + raw.length;
						if(peer.tail <= opt.pack){
							peer.batch.push(raw); // peer.batch += (tmp?'':',')+raw; // TODO: Prevent double JSON! // FOR v1.0 !?
							return;
						}
						flush(peer);
					}
					peer.batch = []; // peer.batch = '['; // TODO: Prevent double JSON!
					setTimeout(function(){flush(peer)}, opt.gap);
					send(raw, peer);
				}
				function flush(peer){
					var tmp = peer.batch; // var tmp = peer.batch + ']'; // TODO: Prevent double JSON!
					peer.batch = peer.tail = null;
					if(!tmp){ return }
					if(!tmp.length){ return } // if(3 > tmp.length){ return } // TODO: ^
					try{tmp = (1 === tmp.length? tmp[0] : JSON.stringify(tmp));
					}catch(e){return opt.log('DAM JSON stringify error', e)}
					if(!tmp){ return }
					send(tmp, peer);
				}
				mesh.say.c = mesh.say.d = 0;
			}());
			
			// for now - find better place later.
			function send(raw, peer){ try{
				var wire = peer.wire;
				if(peer.say){
					peer.say(raw);
				} else
				if(wire.send){
					wire.send(raw);
				}
				mesh.say.d += raw.length||0; ++mesh.say.c; // STATS!
			}catch(e){
				(peer.queue = peer.queue || []).push(raw);
			}}

			;(function(){
				mesh.raw = function(msg){ // TODO: Clean this up / delete it / move logic out!
					if(!msg){ return '' }
					var meta = (msg._) || {}, put, hash, tmp;
					if(tmp = meta.raw){ return tmp }
					if(typeof msg === 'string'){ return msg }
					if(!msg.dam){
						var i = 0, to = []; Type.obj.map(opt.peers, function(p){
							to.push(p.url || p.pid || p.id); if(++i > 9){ return true } // limit server, fast fix, improve later! // For "tower" peer, MUST include 6 surrounding ids.
						}); if(i > 1){ msg['><'] = to.join() }
					}
					var raw = $(msg); // optimize by reusing put = the JSON.stringify from .hash?
					/*if(u !== put){
						tmp = raw.indexOf(_, raw.indexOf('put'));
						raw = raw.slice(0, tmp-1) + put + raw.slice(tmp + _.length + 1);
						//raw = raw.replace('"'+ _ +'"', put); // NEVER USE THIS! ALSO NEVER DELETE IT TO NOT MAKE SAME MISTAKE! https://github.com/amark/gun/wiki/@$$ Heisenbug
					}*/
					if(meta){ meta.raw = raw }
					return raw;
				}
				var $ = JSON.stringify, _ = ':])([:';

			}());

			mesh.hi = function(peer){
				var tmp = peer.wire || {};
				if(peer.id){
					opt.peers[peer.url || peer.id] = peer;
				} else {
					tmp = peer.id = peer.id || Type.text.random(9);
					mesh.say({dam: '?'}, opt.peers[tmp] = peer);
				}
				peer.met = peer.met || +(new Date);
				if(!tmp.hied){ root.on(tmp.hied = 'hi', peer) }
				// @rogowski I need this here by default for now to fix go1dfish's bug
				tmp = peer.queue; peer.queue = [];
				Type.obj.map(tmp, function(msg){
					send(msg, peer);
				});
			}
			mesh.bye = function(peer){
				Type.obj.del(opt.peers, peer.id); // assume if peer.url then reconnect
				root.on('bye', peer);
				var tmp = +(new Date); tmp = (tmp - (peer.met||tmp));
				mesh.bye.time = ((mesh.bye.time || tmp) + tmp) / 2;
			}
			mesh.hear['!'] = function(msg, peer){ opt.log('Error:', msg.err) }
			mesh.hear['?'] = function(msg, peer){
				if(!msg.pid){
					mesh.say({dam: '?', pid: opt.pid, '@': msg['#']}, peer);
					// @rogowski I want to re-enable this AXE logic with some fix/merge later.
					/* var tmp = peer.queue; peer.queue = [];
					Type.obj.map(tmp, function(msg){
						mesh.say(msg, peer);
					}); */
					// @rogowski 2: I think with my PID fix we can delete this and use the original. 
					return;
				}
				if(peer.pid){ return }
				peer.pid = msg.pid;
			}

			root.on('create', function(root){
				root.opt.pid = root.opt.pid || Type.text.random(9);
				this.to.next(root);
				root.on('out', mesh.say);
			});

			var gets = {};
			root.on('bye', function(peer, tmp){ this.to.next(peer);
				if(!(tmp = peer.url)){ return } gets[tmp] = true;
				setTimeout(function(){ delete gets[tmp] },opt.lack || 9000);
			});
			root.on('hi', function(peer, tmp){ this.to.next(peer);
				if(!(tmp = peer.url) || !gets[tmp]){ return } delete gets[tmp];
				Type.obj.map(root.next, function(node, soul){
					tmp = {}; tmp[soul] = root.graph[soul];
					mesh.say({'##': Type.obj.hash(tmp), get: {'#': soul}}, peer);
				})
			});

			return mesh;
		}

		;(function(){
			Type.text.hash = function(s){ // via SO
				if(typeof s !== 'string'){ return {err: 1} }
		    var c = 0;
		    if(!s.length){ return c }
		    for(var i=0,l=s.length,n; i<l; ++i){
		      n = s.charCodeAt(i);
		      c = ((c<<5)-c)+n;
		      c |= 0;
		    }
		    return c; // Math.abs(c);
		  }
			
			var $ = JSON.stringify, u;

			Type.obj.hash = function(obj, hash){
				if(!hash && u === (obj = $(obj, sort))){ return }
				return Type.text.hash(hash || obj || '');
			}

			function sort(k, v){ var tmp;
				if(!(v instanceof Object)){ return v }
				Type.obj.map(Object.keys(v).sort(), map, {to: tmp = {}, on: v});
				return tmp;
			}
			Type.obj.hash.sort = sort;

			function map(k){
				this.to[k] = this.on[k];
			}
		}());

	  var empty = {}, ok = true, u;
	  Object.keys = Object.keys || function(o){ return map(o, function(v,k,t){t(k)}) }

	  try{ module.exports = Mesh }catch(e){}

	})(USE, './adapters/mesh');

	;USE(function(module){
		var Gun = USE('../index');
		Gun.Mesh = USE('./mesh');

		Gun.on('opt', function(root){
			this.to.next(root);
			var opt = root.opt;
			if(root.once){ return }
			if(false === opt.WebSocket){ return }

			var env;
			if(typeof window !== "undefined"){ env = window }
			if(typeof global !== "undefined"){ env = global }
			env = env || {};

			var websocket = opt.WebSocket || env.WebSocket || env.webkitWebSocket || env.mozWebSocket;
			if(!websocket){ return }
			opt.WebSocket = websocket;

			var mesh = opt.mesh = opt.mesh || Gun.Mesh(root);

			var wire = mesh.wire || opt.wire;
			mesh.wire = opt.wire = open;
			function open(peer){ try{
				if(!peer || !peer.url){ return wire && wire(peer) }
				var url = peer.url.replace('http', 'ws');
				var wire = peer.wire = new opt.WebSocket(url);
				wire.onclose = function(){
					opt.mesh.bye(peer);
					reconnect(peer);
				};
				wire.onerror = function(error){
					reconnect(peer); // placement?
					if(!error){ return }
					if(error.code === 'ECONNREFUSED'){
						//reconnect(peer, as);
					}
				};
				wire.onopen = function(){
					opt.mesh.hi(peer);
				}
				wire.onmessage = function(msg){
					if(!msg){ return }
					opt.mesh.hear(msg.data || msg, peer);
				};
				return wire;
			}catch(e){}}

			var wait = 2 * 1000;
			function reconnect(peer){
				clearTimeout(peer.defer);
				if(doc && peer.retry <= 0){ return } peer.retry = (peer.retry || opt.retry || 60) - 1;
				peer.defer = setTimeout(function to(){
					if(doc && doc.hidden){ return setTimeout(to,wait) }
					open(peer);
				}, wait);
			}
			var doc = 'undefined' !== typeof document && document;
		});
		var noop = function(){};
	})(USE, './adapters/websocket');

}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (global){
;(function(){
	// NOTE: While the algorithm is P2P,
	// the current implementation is one sided,
	// only browsers self-modify, servers do not.
	// Need to fix this! Since WebRTC is now working.
	var env;
	if(typeof global !== "undefined"){ env = global }
	if(typeof window !== "undefined"){ var Gun = (env = window).Gun }
	else {
	if(typeof require !== "undefined"){ var Gun = require('./gun') }
	}

	Gun.on('opt', function(ctx){
		this.to.next(ctx);
		if(ctx.once){ return }
		ctx.on('in', function(at){
			if(!at.nts && !at.NTS){
				return this.to.next(at);
			}
			if(at['@']){
				(ask[at['@']]||noop)(at);
				return;
			}
			if(env.window){
				return this.to.next(at);
			}
			this.to.next({'@': at['#'], nts: Gun.time.is()});
		});
		var ask = {}, noop = function(){};
		if(!env.window){ return }

		Gun.state.drift = Gun.state.drift || 0;
		setTimeout(function ping(){
			var NTS = {}, ack = Gun.text.random(), msg = {'#': ack, nts: true};
			NTS.start = Gun.state();
			ask[ack] = function(at){
				NTS.end = Gun.state();
				Gun.obj.del(ask, ack);
				NTS.latency = (NTS.end - NTS.start)/2;
				if(!at.nts && !at.NTS){ return }
				NTS.calc = NTS.latency + (at.NTS || at.nts);
				Gun.state.drift -= (NTS.end - NTS.calc)/2;
				setTimeout(ping, 1000);
			}
			ctx.on('out', msg);
		}, 1);
	});
	// test by opening up examples/game/nts.html on devices that aren't NTP synced.
}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./gun":4}],6:[function(require,module,exports){
(function (global,Buffer){
;(function(){

  /* UNBUILD */
  var root;
  if(typeof window !== "undefined"){ root = window }
  if(typeof global !== "undefined"){ root = global }
  root = root || {};
  var console = root.console || {log: function(){}};
  function USE(arg, req){
    return req? require(arg) : arg.slice? USE[R(arg)] : function(mod, path){
      arg(mod = {exports: {}});
      USE[R(path)] = mod.exports;
    }
    function R(p){
      return p.split('/').slice(-1).toString().replace('.js','');
    }
  }
  if(typeof module !== "undefined"){ var common = module }
  /* UNBUILD */

  ;USE(function(module){
    // Security, Encryption, and Authorization: SEA.js
    // MANDATORY READING: https://gun.eco/explainers/data/security.html
    // IT IS IMPLEMENTED IN A POLYFILL/SHIM APPROACH.
    // THIS IS AN EARLY ALPHA!

    if(typeof window !== "undefined"){ module.window = window }

    var tmp = module.window || module;
    var SEA = tmp.SEA || {};

    if(SEA.window = module.window){ SEA.window.SEA = SEA }

    try{ if(typeof common !== "undefined"){ common.exports = SEA } }catch(e){}
    module.exports = SEA;
  })(USE, './root');

  ;USE(function(module){
    var SEA = USE('./root');
    try{ if(SEA.window){
      if(location.protocol.indexOf('s') < 0
      && location.host.indexOf('localhost') < 0
      && location.protocol.indexOf('file:') < 0){
        location.protocol = 'https:'; // WebCrypto does NOT work without HTTPS!
      }
    } }catch(e){}
  })(USE, './https');

  ;USE(function(module){
    // This is Array extended to have .toString(['utf8'|'hex'|'base64'])
    function SeaArray() {}
    Object.assign(SeaArray, { from: Array.from })
    SeaArray.prototype = Object.create(Array.prototype)
    SeaArray.prototype.toString = function(enc, start, end) { enc = enc || 'utf8'; start = start || 0;
      const length = this.length
      if (enc === 'hex') {
        const buf = new Uint8Array(this)
        return [ ...Array(((end && (end + 1)) || length) - start).keys()]
        .map((i) => buf[ i + start ].toString(16).padStart(2, '0')).join('')
      }
      if (enc === 'utf8') {
        return Array.from(
          { length: (end || length) - start },
          (_, i) => String.fromCharCode(this[ i + start])
        ).join('')
      }
      if (enc === 'base64') {
        return btoa(this)
      }
    }
    module.exports = SeaArray;
  })(USE, './array');

  ;USE(function(module){
    // This is Buffer implementation used in SEA. Functionality is mostly
    // compatible with NodeJS 'safe-buffer' and is used for encoding conversions
    // between binary and 'hex' | 'utf8' | 'base64'
    // See documentation and validation for safe implementation in:
    // https://github.com/feross/safe-buffer#update
    var SeaArray = USE('./array');
    function SafeBuffer(...props) {
      console.warn('new SafeBuffer() is depreciated, please use SafeBuffer.from()')
      return SafeBuffer.from(...props)
    }
    SafeBuffer.prototype = Object.create(Array.prototype)
    Object.assign(SafeBuffer, {
      // (data, enc) where typeof data === 'string' then enc === 'utf8'|'hex'|'base64'
      from() {
        if (!Object.keys(arguments).length) {
          throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
        }
        const input = arguments[0]
        let buf
        if (typeof input === 'string') {
          const enc = arguments[1] || 'utf8'
          if (enc === 'hex') {
            const bytes = input.match(/([\da-fA-F]{2})/g)
            .map((byte) => parseInt(byte, 16))
            if (!bytes || !bytes.length) {
              throw new TypeError('Invalid first argument for type \'hex\'.')
            }
            buf = SeaArray.from(bytes)
          } else if (enc === 'utf8') {
            const length = input.length
            const words = new Uint16Array(length)
            Array.from({ length: length }, (_, i) => words[i] = input.charCodeAt(i))
            buf = SeaArray.from(words)
          } else if (enc === 'base64') {
            const dec = atob(input)
            const length = dec.length
            const bytes = new Uint8Array(length)
            Array.from({ length: length }, (_, i) => bytes[i] = dec.charCodeAt(i))
            buf = SeaArray.from(bytes)
          } else if (enc === 'binary') {
            buf = SeaArray.from(input)
          } else {
            console.info('SafeBuffer.from unknown encoding: '+enc)
          }
          return buf
        }
        const byteLength = input.byteLength // what is going on here? FOR MARTTI
        const length = input.byteLength ? input.byteLength : input.length
        if (length) {
          let buf
          if (input instanceof ArrayBuffer) {
            buf = new Uint8Array(input)
          }
          return SeaArray.from(buf || input)
        }
      },
      // This is 'safe-buffer.alloc' sans encoding support
      alloc(length, fill = 0 /*, enc*/ ) {
        return SeaArray.from(new Uint8Array(Array.from({ length: length }, () => fill)))
      },
      // This is normal UNSAFE 'buffer.alloc' or 'new Buffer(length)' - don't use!
      allocUnsafe(length) {
        return SeaArray.from(new Uint8Array(Array.from({ length : length })))
      },
      // This puts together array of array like members
      concat(arr) { // octet array
        if (!Array.isArray(arr)) {
          throw new TypeError('First argument must be Array containing ArrayBuffer or Uint8Array instances.')
        }
        return SeaArray.from(arr.reduce((ret, item) => ret.concat(Array.from(item)), []))
      }
    })
    SafeBuffer.prototype.from = SafeBuffer.from
    SafeBuffer.prototype.toString = SeaArray.prototype.toString

    module.exports = SafeBuffer;
  })(USE, './buffer');

  ;USE(function(module){
    const SEA = USE('./root')
    const Buffer = USE('./buffer')
    const api = {Buffer: Buffer}
    var o = {};

    if(SEA.window){
      api.crypto = window.crypto || window.msCrypto;
      api.subtle = (api.crypto||o).subtle || (api.crypto||o).webkitSubtle;
      api.TextEncoder = window.TextEncoder;
      api.TextDecoder = window.TextDecoder;
      api.random = (len) => Buffer.from(api.crypto.getRandomValues(new Uint8Array(Buffer.alloc(len))))
    }
    if(!api.crypto){try{
      var crypto = USE('crypto', 1);
      const { TextEncoder, TextDecoder } = USE('text-encoding', 1)
      Object.assign(api, {
        crypto,
        //subtle,
        TextEncoder,
        TextDecoder,
        random: (len) => Buffer.from(crypto.randomBytes(len))
      });
      //try{
        const WebCrypto = USE('node-webcrypto-ossl', 1);
        api.ossl = api.subtle = new WebCrypto({directory: 'ossl'}).subtle // ECDH
      //}catch(e){
        //console.log("node-webcrypto-ossl is optionally needed for ECDH, please install if needed.");
      //}
    }catch(e){
      console.log("node-webcrypto-ossl and text-encoding may not be included by default, please add it to your package.json!");
      OSSL_WEBCRYPTO_OR_TEXT_ENCODING_NOT_INSTALLED;
    }}

    module.exports = api
  })(USE, './shim');

  ;USE(function(module){
    var SEA = USE('./root');
    var Buffer = USE('./buffer');
    var s = {};
    s.pbkdf2 = {hash: 'SHA-256', iter: 100000, ks: 64};
    s.ecdsa = {
      pair: {name: 'ECDSA', namedCurve: 'P-256'},
      sign: {name: 'ECDSA', hash: {name: 'SHA-256'}}
    };
    s.ecdh = {name: 'ECDH', namedCurve: 'P-256'};

    // This creates Web Cryptography API compliant JWK for sign/verify purposes
    s.jwk = function(pub, d){  // d === priv
      pub = pub.split('.');
      var x = pub[0], y = pub[1];
      var jwk = {kty: "EC", crv: "P-256", x: x, y: y, ext: true};
      jwk.key_ops = d ? ['sign'] : ['verify'];
      if(d){ jwk.d = d }
      return jwk;
    };
    s.recall = {
      validity: 12 * 60 * 60, // internally in seconds : 12 hours
      hook: function(props){ return props } // { iat, exp, alias, remember } // or return new Promise((resolve, reject) => resolve(props)
    };

    s.check = function(t){ return (typeof t == 'string') && ('SEA{' === t.slice(0,4)) }
    s.parse = function p(t){ try {
      var yes = (typeof t == 'string');
      if(yes && 'SEA{' === t.slice(0,4)){ t = t.slice(3) }
      return yes ? JSON.parse(t) : t;
      } catch (e) {}
      return t;
    }

    SEA.opt = s;
    module.exports = s
  })(USE, './settings');

  ;USE(function(module){
    var shim = USE('./shim');
    module.exports = async function(d, o){
      var t = (typeof d == 'string')? d : JSON.stringify(d);
      var hash = await shim.subtle.digest({name: o||'SHA-256'}, new shim.TextEncoder().encode(t));
      return shim.Buffer.from(hash);
    }
  })(USE, './sha256');

  ;USE(function(module){
    // This internal func returns SHA-1 hashed data for KeyID generation
    const __shim = USE('./shim')
    const subtle = __shim.subtle
    const ossl = __shim.ossl ? __shim.ossl : subtle
    const sha1hash = (b) => ossl.digest({name: 'SHA-1'}, new ArrayBuffer(b))
    module.exports = sha1hash
  })(USE, './sha1');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');
    var sha = USE('./sha256');
    var u;

    SEA.work = SEA.work || (async (data, pair, cb, opt) => { try { // used to be named `proof`
      var salt = (pair||{}).epub || pair; // epub not recommended, salt should be random!
      var opt = opt || {};
      if(salt instanceof Function){
        cb = salt;
        salt = u;
      }
      salt = salt || shim.random(9);
      data = (typeof data == 'string')? data : JSON.stringify(data);
      if('sha' === (opt.name||'').toLowerCase().slice(0,3)){
        var rsha = shim.Buffer.from(await sha(data, opt.name), 'binary').toString(opt.encode || 'base64')
        if(cb){ try{ cb(rsha) }catch(e){console.log(e)} }
        return rsha;
      }
      var key = await (shim.ossl || shim.subtle).importKey('raw', new shim.TextEncoder().encode(data), {name: opt.name || 'PBKDF2'}, false, ['deriveBits']);
      var work = await (shim.ossl || shim.subtle).deriveBits({
        name: opt.name || 'PBKDF2',
        iterations: opt.iterations || S.pbkdf2.iter,
        salt: new shim.TextEncoder().encode(opt.salt || salt),
        hash: opt.hash || S.pbkdf2.hash,
      }, key, opt.length || (S.pbkdf2.ks * 8))
      data = shim.random(data.length)  // Erase data in case of passphrase
      var r = shim.Buffer.from(work, 'binary').toString(opt.encode || 'base64')
      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) { 
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    module.exports = SEA.work;
  })(USE, './work');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');

    SEA.name = SEA.name || (async (cb, opt) => { try {
      if(cb){ try{ cb() }catch(e){console.log(e)} }
      return;
    } catch(e) {
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    //SEA.pair = async (data, proof, cb) => { try {
    SEA.pair = SEA.pair || (async (cb, opt) => { try {

      var ecdhSubtle = shim.ossl || shim.subtle;
      // First: ECDSA keys for signing/verifying...
      var sa = await shim.subtle.generateKey(S.ecdsa.pair, true, [ 'sign', 'verify' ])
      .then(async (keys) => {
        // privateKey scope doesn't leak out from here!
        //const { d: priv } = await shim.subtle.exportKey('jwk', keys.privateKey)
        var key = {};
        key.priv = (await shim.subtle.exportKey('jwk', keys.privateKey)).d;
        var pub = await shim.subtle.exportKey('jwk', keys.publicKey);
        //const pub = Buff.from([ x, y ].join(':')).toString('base64') // old
        key.pub = pub.x+'.'+pub.y; // new
        // x and y are already base64
        // pub is UTF8 but filename/URL safe (https://www.ietf.org/rfc/rfc3986.txt)
        // but split on a non-base64 letter.
        return key;
      })
      
      // To include PGPv4 kind of keyId:
      // const pubId = await SEA.keyid(keys.pub)
      // Next: ECDH keys for encryption/decryption...

      try{
      var dh = await ecdhSubtle.generateKey(S.ecdh, true, ['deriveKey'])
      .then(async (keys) => {
        // privateKey scope doesn't leak out from here!
        var key = {};
        key.epriv = (await ecdhSubtle.exportKey('jwk', keys.privateKey)).d;
        var pub = await ecdhSubtle.exportKey('jwk', keys.publicKey);
        //const epub = Buff.from([ ex, ey ].join(':')).toString('base64') // old
        key.epub = pub.x+'.'+pub.y; // new
        // ex and ey are already base64
        // epub is UTF8 but filename/URL safe (https://www.ietf.org/rfc/rfc3986.txt)
        // but split on a non-base64 letter.
        return key;
      })
      }catch(e){
        if(SEA.window){ throw e }
        if(e == 'Error: ECDH is not a supported algorithm'){ console.log('Ignoring ECDH...') }
        else { throw e }
      } dh = dh || {};

      var r = { pub: sa.pub, priv: sa.priv, /* pubId, */ epub: dh.epub, epriv: dh.epriv }
      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) {
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    module.exports = SEA.pair;
  })(USE, './pair');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');
    var sha = USE('./sha256');
    var u;

    SEA.sign = SEA.sign || (async (data, pair, cb, opt) => { try {
      opt = opt || {};
      if(!(pair||opt).priv){
        pair = await SEA.I(null, {what: data, how: 'sign', why: opt.why});
      }
      if(u === data){ throw '`undefined` not allowed.' }
      var json = S.parse(data);
      var check = opt.check = opt.check || json;
      if(SEA.verify && (SEA.opt.check(check) || (check && check.s && check.m))
      && u !== await SEA.verify(check, pair)){ // don't sign if we already signed it.
        var r = S.parse(check);
        if(!opt.raw){ r = 'SEA'+JSON.stringify(r) }
        if(cb){ try{ cb(r) }catch(e){console.log(e)} }
        return r;
      }
      var pub = pair.pub;
      var priv = pair.priv;
      var jwk = S.jwk(pub, priv);
      var hash = await sha(json);
      var sig = await (shim.ossl || shim.subtle).importKey('jwk', jwk, S.ecdsa.pair, false, ['sign'])
      .then((key) => (shim.ossl || shim.subtle).sign(S.ecdsa.sign, key, new Uint8Array(hash))) // privateKey scope doesn't leak out from here!
      var r = {m: json, s: shim.Buffer.from(sig, 'binary').toString(opt.encode || 'base64')}
      if(!opt.raw){ r = 'SEA'+JSON.stringify(r) }

      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) {
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    module.exports = SEA.sign;
  })(USE, './sign');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');
    var sha = USE('./sha256');
    var u;

    SEA.verify = SEA.verify || (async (data, pair, cb, opt) => { try {
      var json = S.parse(data);
      if(false === pair){ // don't verify!
        var raw = S.parse(json.m);
        if(cb){ try{ cb(raw) }catch(e){console.log(e)} }
        return raw;
      }
      opt = opt || {};
      // SEA.I // verify is free! Requires no user permission.
      var pub = pair.pub || pair;
      var key = SEA.opt.slow_leak? await SEA.opt.slow_leak(pub) : await (shim.ossl || shim.subtle).importKey('jwk', jwk, S.ecdsa.pair, false, ['verify']);
      var hash = await sha(json.m);
      var buf, sig, check, tmp; try{
        buf = shim.Buffer.from(json.s, opt.encode || 'base64'); // NEW DEFAULT!
        sig = new Uint8Array(buf);
        check = await (shim.ossl || shim.subtle).verify(S.ecdsa.sign, key, sig, new Uint8Array(hash));
        if(!check){ throw "Signature did not match." }
      }catch(e){
        if(SEA.opt.fallback){
          return await SEA.opt.fall_verify(data, pair, cb, opt);
        }
      }
      var r = check? S.parse(json.m) : u;

      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) {
      console.log(e); // mismatched owner FOR MARTTI
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    module.exports = SEA.verify;
    // legacy & ossl leak mitigation:

    var knownKeys = {};
    var keyForPair = SEA.opt.slow_leak = pair => {
      if (knownKeys[pair]) return knownKeys[pair];
      var jwk = S.jwk(pair);
      knownKeys[pair] = (shim.ossl || shim.subtle).importKey("jwk", jwk, S.ecdsa.pair, false, ["verify"]);
      return knownKeys[pair];
    };


    SEA.opt.fall_verify = async function(data, pair, cb, opt, f){
      if(f === SEA.opt.fallback){ throw "Signature did not match" } f = f || 1;
      var json = S.parse(data), pub = pair.pub || pair, key = await SEA.opt.slow_leak(pub);
      var hash = (f <= SEA.opt.fallback)? shim.Buffer.from(await shim.subtle.digest({name: 'SHA-256'}, new shim.TextEncoder().encode(S.parse(json.m)))) : await sha(json.m); // this line is old bad buggy code but necessary for old compatibility.
      var buf; var sig; var check; try{
        buf = shim.Buffer.from(json.s, opt.encode || 'base64') // NEW DEFAULT!
        sig = new Uint8Array(buf)
        check = await (shim.ossl || shim.subtle).verify(S.ecdsa.sign, key, sig, new Uint8Array(hash))
        if(!check){ throw "Signature did not match." }
      }catch(e){
        buf = shim.Buffer.from(json.s, 'utf8') // AUTO BACKWARD OLD UTF8 DATA!
        sig = new Uint8Array(buf)
        check = await (shim.ossl || shim.subtle).verify(S.ecdsa.sign, key, sig, new Uint8Array(hash))
        if(!check){ throw "Signature did not match." }
      }
      var r = check? S.parse(json.m) : u;
      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    }
    SEA.opt.fallback = 2;

  })(USE, './verify');

  ;USE(function(module){
    var shim = USE('./shim');
    var sha256hash = USE('./sha256');

    const importGen = async (key, salt, opt) => {
      //const combo = shim.Buffer.concat([shim.Buffer.from(key, 'utf8'), salt || shim.random(8)]).toString('utf8') // old
      var opt = opt || {};
      const combo = key + (salt || shim.random(8)).toString('utf8'); // new
      const hash = shim.Buffer.from(await sha256hash(combo), 'binary')
      return await shim.subtle.importKey('raw', new Uint8Array(hash), opt.name || 'AES-GCM', false, ['encrypt', 'decrypt'])
    }
    module.exports = importGen;
  })(USE, './aeskey');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');
    var aeskey = USE('./aeskey');
    var u;

    SEA.encrypt = SEA.encrypt || (async (data, pair, cb, opt) => { try {
      opt = opt || {};
      var key = (pair||opt).epriv || pair;
      if(u === data){ throw '`undefined` not allowed.' }
      if(!key){
        pair = await SEA.I(null, {what: data, how: 'encrypt', why: opt.why});
        key = pair.epriv || pair;
      }
      var msg = (typeof data == 'string')? data : JSON.stringify(data);
      var rand = {s: shim.random(9), iv: shim.random(15)}; // consider making this 9 and 15 or 18 or 12 to reduce == padding.
      var ct = await aeskey(key, rand.s, opt).then((aes) => (/*shim.ossl ||*/ shim.subtle).encrypt({ // Keeping the AES key scope as private as possible...
        name: opt.name || 'AES-GCM', iv: new Uint8Array(rand.iv)
      }, aes, new shim.TextEncoder().encode(msg)));
      var r = {
        ct: shim.Buffer.from(ct, 'binary').toString(opt.encode || 'base64'),
        iv: rand.iv.toString(opt.encode || 'base64'),
        s: rand.s.toString(opt.encode || 'base64')
      }
      if(!opt.raw){ r = 'SEA'+JSON.stringify(r) }

      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) { 
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    module.exports = SEA.encrypt;
  })(USE, './encrypt');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');
    var aeskey = USE('./aeskey');

    SEA.decrypt = SEA.decrypt || (async (data, pair, cb, opt) => { try {
      opt = opt || {};
      var key = (pair||opt).epriv || pair;
      if(!key){
        pair = await SEA.I(null, {what: data, how: 'decrypt', why: opt.why});
        key = pair.epriv || pair;
      }
      var json = S.parse(data);
      var buf, bufiv, bufct; try{
        buf = shim.Buffer.from(json.s, opt.encode || 'base64');
        bufiv = shim.Buffer.from(json.iv, opt.encode || 'base64');
        bufct = shim.Buffer.from(json.ct, opt.encode || 'base64');
        var ct = await aeskey(key, buf, opt).then((aes) => (/*shim.ossl ||*/ shim.subtle).decrypt({  // Keeping aesKey scope as private as possible...
          name: opt.name || 'AES-GCM', iv: new Uint8Array(bufiv)
        }, aes, new Uint8Array(bufct)));
      }catch(e){
        if('utf8' === opt.encode){ throw "Could not decrypt" }
        if(SEA.opt.fallback){
          opt.encode = 'utf8';
          return await SEA.decrypt(data, pair, cb, opt);
        }
      }
      var r = S.parse(new shim.TextDecoder('utf8').decode(ct));
      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) { 
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    module.exports = SEA.decrypt;
  })(USE, './decrypt');

  ;USE(function(module){
    var SEA = USE('./root');
    var shim = USE('./shim');
    var S = USE('./settings');
    // Derive shared secret from other's pub and my epub/epriv 
    SEA.secret = SEA.secret || (async (key, pair, cb, opt) => { try {
      opt = opt || {};
      if(!pair || !pair.epriv || !pair.epub){
        pair = await SEA.I(null, {what: key, how: 'secret', why: opt.why});
      }
      var pub = key.epub || key;
      var epub = pair.epub;
      var epriv = pair.epriv;
      var ecdhSubtle = shim.ossl || shim.subtle;
      var pubKeyData = keysToEcdhJwk(pub);
      var props = Object.assign(S.ecdh, { public: await ecdhSubtle.importKey(...pubKeyData, true, []) });
      var privKeyData = keysToEcdhJwk(epub, epriv);
      var derived = await ecdhSubtle.importKey(...privKeyData, false, ['deriveKey']).then(async (privKey) => {
        // privateKey scope doesn't leak out from here!
        var derivedKey = await ecdhSubtle.deriveKey(props, privKey, { name: 'AES-GCM', length: 256 }, true, [ 'encrypt', 'decrypt' ]);
        return ecdhSubtle.exportKey('jwk', derivedKey).then(({ k }) => k);
      })
      var r = derived;
      if(cb){ try{ cb(r) }catch(e){console.log(e)} }
      return r;
    } catch(e) {
      console.log(e);
      SEA.err = e;
      if(SEA.throw){ throw e }
      if(cb){ cb() }
      return;
    }});

    // can this be replaced with settings.jwk?
    var keysToEcdhJwk = (pub, d) => { // d === priv
      //var [ x, y ] = Buffer.from(pub, 'base64').toString('utf8').split(':') // old
      var [ x, y ] = pub.split('.') // new
      var jwk = d ? { d: d } : {}
      return [  // Use with spread returned value...
        'jwk',
        Object.assign(
          jwk,
          { x: x, y: y, kty: 'EC', crv: 'P-256', ext: true }
        ), // ??? refactor
        S.ecdh
      ]
    }

    module.exports = SEA.secret;
  })(USE, './secret');

  ;USE(function(module){
    var shim = USE('./shim');
    // Practical examples about usage found from ./test/common.js
    var SEA = USE('./root');
    SEA.work = USE('./work');
    SEA.sign = USE('./sign');
    SEA.verify = USE('./verify');
    SEA.encrypt = USE('./encrypt');
    SEA.decrypt = USE('./decrypt');

    SEA.random = SEA.random || shim.random;

    // This is Buffer used in SEA and usable from Gun/SEA application also.
    // For documentation see https://nodejs.org/api/buffer.html
    SEA.Buffer = SEA.Buffer || USE('./buffer');

    // These SEA functions support now ony Promises or
    // async/await (compatible) code, use those like Promises.
    //
    // Creates a wrapper library around Web Crypto API
    // for various AES, ECDSA, PBKDF2 functions we called above.
    // Calculate public key KeyID aka PGPv4 (result: 8 bytes as hex string)
    SEA.keyid = SEA.keyid || (async (pub) => {
      try {
        // base64('base64(x):base64(y)') => Buffer(xy)
        const pb = Buffer.concat(
          pub.replace(/-/g, '+').replace(/_/g, '/').split('.')
          .map((t) => Buffer.from(t, 'base64'))
        )
        // id is PGPv4 compliant raw key
        const id = Buffer.concat([
          Buffer.from([0x99, pb.length / 0x100, pb.length % 0x100]), pb
        ])
        const sha1 = await sha1hash(id)
        const hash = Buffer.from(sha1, 'binary')
        return hash.toString('hex', hash.length - 8)  // 16-bit ID as hex
      } catch (e) {
        console.log(e)
        throw e
      }
    });
    // all done!
    // Obviously it is missing MANY necessary features. This is only an alpha release.
    // Please experiment with it, audit what I've done so far, and complain about what needs to be added.
    // SEA should be a full suite that is easy and seamless to use.
    // Again, scroll naer the top, where I provide an EXAMPLE of how to create a user and sign in.
    // Once logged in, the rest of the code you just read handled automatically signing/validating data.
    // But all other behavior needs to be equally easy, like opinionated ways of
    // Adding friends (trusted public keys), sending private messages, etc.
    // Cheers! Tell me what you think.
    var Gun = (SEA.window||{}).Gun || USE((typeof common == "undefined"?'.':'')+'./gun', 1);
    Gun.SEA = SEA;
    SEA.GUN = SEA.Gun = Gun;

    module.exports = SEA
  })(USE, './sea');

  ;USE(function(module){
    var Gun = USE('./sea').Gun;
    Gun.chain.then = function(cb){
      var gun = this, p = (new Promise(function(res, rej){
        gun.once(res);
      }));
      return cb? p.then(cb) : p;
    }
  })(USE, './then');

  ;USE(function(module){
    var SEA = USE('./sea');
    var Gun = SEA.Gun;
    var then = USE('./then');

    function User(root){ 
      this._ = {$: this};
    }
    User.prototype = (function(){ function F(){}; F.prototype = Gun.chain; return new F() }()) // Object.create polyfill
    User.prototype.constructor = User;

    // let's extend the gun chain with a `user` function.
    // only one user can be logged in at a time, per gun instance.
    Gun.chain.user = function(pub){
      var gun = this, root = gun.back(-1), user;
      if(pub){ return root.get('~'+pub) }
      if(user = root.back('user')){ return user }
      var root = (root._), at = root, uuid = at.opt.uuid || Gun.state.lex;
      (at = (user = at.user = gun.chain(new User))._).opt = {};
      at.opt.uuid = function(cb){
        var id = uuid(), pub = root.user;
        if(!pub || !(pub = pub.is) || !(pub = pub.pub)){ return id }
        id = id + '~' + pub + '.';
        if(cb && cb.call){ cb(null, id) }
        return id;
      }
      return user;
    }
    Gun.User = User;
    module.exports = User;
  })(USE, './user');

  ;USE(function(module){
    // TODO: This needs to be split into all separate functions.
    // Not just everything thrown into 'create'.

    var SEA = USE('./sea');
    var User = USE('./user');
    var authsettings = USE('./settings');
    var Gun = SEA.Gun;

    var noop = function(){};

    // Well first we have to actually create a user. That is what this function does.
    User.prototype.create = function(alias, pass, cb, opt){
      var gun = this, cat = (gun._), root = gun.back(-1);
      cb = cb || noop;
      if(cat.ing){
        cb({err: Gun.log("User is already being created or authenticated!"), wait: true});
        return gun;
      }
      cat.ing = true;
      opt = opt || {};
      var act = {}, u;
      act.a = function(pubs){
        act.pubs = pubs;
        if(pubs && !opt.already){
          // If we can enforce that a user name is already taken, it might be nice to try, but this is not guaranteed.
          var ack = {err: Gun.log('User already created!')};
          cat.ing = false;
          cb(ack);
          gun.leave();
          return;
        }
        act.salt = Gun.text.random(64); // pseudo-randomly create a salt, then use PBKDF2 function to extend the password with it.
        SEA.work(pass, act.salt, act.b); // this will take some short amount of time to produce a proof, which slows brute force attacks.
      }
      act.b = function(proof){
        act.proof = proof;
        SEA.pair(act.c); // now we have generated a brand new ECDSA key pair for the user account.
      }
      act.c = function(pair){ var tmp;
        act.pair = pair || {};
        if(tmp = cat.root.user){
          tmp._.sea = pair;
          tmp.is = {pub: pair.pub, epub: pair.epub, alias: alias};
        }
        // the user's public key doesn't need to be signed. But everything else needs to be signed with it! // we have now automated it! clean up these extra steps now!
        act.data = {pub: pair.pub};
        act.d();
      }
      act.d = function(){
        act.data.alias = alias;
        act.e();
      }
      act.e = function(){
        act.data.epub = act.pair.epub; 
        SEA.encrypt({priv: act.pair.priv, epriv: act.pair.epriv}, act.proof, act.f, {raw:1}); // to keep the private key safe, we AES encrypt it with the proof of work!
      }
      act.f = function(auth){
        act.data.auth = JSON.stringify({ek: auth, s: act.salt}); 
        act.g(act.data.auth);
      }
      act.g = function(auth){ var tmp;
        act.data.auth = act.data.auth || auth;
        root.get(tmp = '~'+act.pair.pub).put(act.data); // awesome, now we can actually save the user with their public key as their ID.
        root.get('~@'+alias).put(Gun.obj.put({}, tmp, Gun.val.link.ify(tmp))); // next up, we want to associate the alias with the public key. So we add it to the alias list.
        setTimeout(function(){ // we should be able to delete this now, right?
        cat.ing = false;
        cb({ok: 0, pub: act.pair.pub}); // callback that the user has been created. (Note: ok = 0 because we didn't wait for disk to ack)
        if(noop === cb){ gun.auth(alias, pass) } // if no callback is passed, auto-login after signing up.
        },10);
      }
      root.get('~@'+alias).once(act.a);
      return gun;
    }
    // now that we have created a user, we want to authenticate them!
    User.prototype.auth = function(alias, pass, cb, opt){
      var gun = this, cat = (gun._), root = gun.back(-1);
      cb = cb || function(){};
      if(cat.ing){
        cb({err: Gun.log("User is already being created or authenticated!"), wait: true});
        return gun;
      }
      cat.ing = true;
      opt = opt || {};
      var pair = (alias && (alias.pub || alias.epub))? alias : (pass && (pass.pub || pass.epub))? pass : null;
      var act = {}, u;
      act.a = function(data){
        if(!data){ return act.b() }
        if(!data.pub){
          var tmp = [];
          Gun.node.is(data, function(v){ tmp.push(v) })
          return act.b(tmp);
        }
        if(act.name){ return act.f(data) }
        act.c((act.data = data).auth);
      }
      act.b = function(list){
        var get = (act.list = (act.list||[]).concat(list||[])).shift();
        if(u === get){
          if(act.name){ return act.err('Your user account is not published for dApps to access, please consider syncing it online, or allowing local access by adding your device as a peer.') }
          return act.err('Wrong user or password.') 
        }
        root.get(get).once(act.a);
      }
      act.c = function(auth){
        if(u === auth){ return act.b() }
        if(Gun.text.is(auth)){ return act.c(Gun.obj.ify(auth)) } // in case of legacy
        SEA.work(pass, (act.auth = auth).s, act.d, act.enc); // the proof of work is evidence that we've spent some time/effort trying to log in, this slows brute force.
      }
      act.d = function(proof){
        SEA.decrypt(act.auth.ek, proof, act.e, act.enc);
      }
      act.e = function(half){
        if(u === half){
          if(!act.enc){ // try old format
            act.enc = {encode: 'utf8'};
            return act.c(act.auth);
          } act.enc = null; // end backwards
          return act.b();
        }
        act.half = half;
        act.f(act.data);
      }
      act.f = function(data){
        if(!data || !data.pub){ return act.b() }
        var tmp = act.half || {};
        act.g({pub: data.pub, epub: data.epub, priv: tmp.priv, epriv: tmp.epriv});
      }
      act.g = function(pair){
        act.pair = pair;
        var user = (root._).user, at = (user._);
        var tmp = at.tag;
        var upt = at.opt;
        at = user._ = root.get('~'+pair.pub)._;
        at.opt = upt;
        // add our credentials in-memory only to our root user instance
        user.is = {pub: pair.pub, epub: pair.epub, alias: alias};
        at.sea = act.pair;
        cat.ing = false;
        try{if(pass && !Gun.obj.has(Gun.obj.ify(cat.root.graph['~'+pair.pub].auth), ':')){ opt.shuffle = opt.change = pass; } }catch(e){} // migrate UTF8 & Shuffle!
        opt.change? act.z() : cb(at);
        if(SEA.window && ((gun.back('user')._).opt||opt).remember){
          // TODO: this needs to be modular.
          try{var sS = {};
          sS = window.sessionStorage;
          sS.recall = true;
          sS.alias = alias;
          sS.tmp = pass;
          }catch(e){}
        }
        try{
          (root._).on('auth', at) // TODO: Deprecate this, emit on user instead! Update docs when you do.
          //at.on('auth', at) // Arrgh, this doesn't work without event "merge" code, but "merge" code causes stack overflow and crashes after logging in & trying to write data.
        }catch(e){
          Gun.log("Your 'auth' callback crashed with:", e);
        }
      }
      act.z = function(){
        // password update so encrypt private key using new pwd + salt
        act.salt = Gun.text.random(64); // pseudo-random
        SEA.work(opt.change, act.salt, act.y);
      }
      act.y = function(proof){
        SEA.encrypt({priv: act.pair.priv, epriv: act.pair.epriv}, proof, act.x, {raw:1});
      }
      act.x = function(auth){
        act.w(JSON.stringify({ek: auth, s: act.salt}));
      }
      act.w = function(auth){
        if(opt.shuffle){ // delete in future!
          console.log('migrate core account from UTF8 & shuffle');
          var tmp = Gun.obj.to(act.data);
          Gun.obj.del(tmp, '_');
          tmp.auth = auth;
          root.get('~'+act.pair.pub).put(tmp);
        } // end delete
        root.get('~'+act.pair.pub).get('auth').put(auth, cb);
      }
      act.err = function(e){
        var ack = {err: Gun.log(e || 'User cannot be found!')};
        cat.ing = false;
        cb(ack);
      }
      act.plugin = function(name){
        if(!(act.name = name)){ return act.err() }
        var tmp = [name];
        if('~' !== name[0]){
          tmp[1] = '~'+name;
          tmp[2] = '~@'+name;
        }
        act.b(tmp);
      }
      if(pair){
        act.g(pair);
      } else
      if(alias){
        root.get('~@'+alias).once(act.a);
      } else
      if(!alias && !pass){
        SEA.name(act.plugin);
      }
      return gun;
    }
    User.prototype.pair = function(){
      console.log("user.pair() IS DEPRECATED AND WILL BE DELETED!!!");
      var user = this;
      if(!user.is){ return false }
      return user._.sea;
    }
    User.prototype.leave = function(opt, cb){
      var gun = this, user = (gun.back(-1)._).user;
      if(user){
        delete user.is;
        delete user._.is;
        delete user._.sea;
      }
      if(SEA.window){
        try{var sS = {};
        sS = window.sessionStorage;
        delete sS.alias;
        delete sS.tmp;
        delete sS.recall;
        }catch(e){};
      }
      return gun;
    }
    // If authenticated user wants to delete his/her account, let's support it!
    User.prototype.delete = async function(alias, pass, cb){
      var gun = this, root = gun.back(-1), user = gun.back('user');
      try {
        user.auth(alias, pass, function(ack){
          var pub = (user.is||{}).pub;
          // Delete user data
          user.map().once(function(){ this.put(null) });
          // Wipe user data from memory
          user.leave();
          (cb || noop)({ok: 0});
        });
      } catch (e) {
        Gun.log('User.delete failed! Error:', e);
      }
      return gun;
    }
    User.prototype.recall = function(opt, cb){
      var gun = this, root = gun.back(-1), tmp;
      opt = opt || {};
      if(opt && opt.sessionStorage){
        if(SEA.window){
          try{var sS = {};
          sS = window.sessionStorage;
          if(sS){
            (root._).opt.remember = true;
            ((gun.back('user')._).opt||opt).remember = true;
            if(sS.recall || (sS.alias && sS.tmp)){
              root.user().auth(sS.alias, sS.tmp, cb);
            }
          }
          }catch(e){}
        }
        return gun;
      }
      /*
        TODO: copy mhelander's expiry code back in.
        Although, we should check with community,
        should expiry be core or a plugin?
      */
      return gun;
    }
    User.prototype.alive = async function(){
      const gunRoot = this.back(-1)
      try {
        // All is good. Should we do something more with actual recalled data?
        await authRecall(gunRoot)
        return gunRoot._.user._
      } catch (e) {
        const err = 'No session!'
        Gun.log(err)
        throw { err }
      }
    }
    User.prototype.trust = async function(user){
      // TODO: BUG!!! SEA `node` read listener needs to be async, which means core needs to be async too.
      //gun.get('alice').get('age').trust(bob);
      if (Gun.is(user)) {
        user.get('pub').get((ctx, ev) => {
          console.log(ctx, ev)
        })
      }
    }
    User.prototype.grant = function(to, cb){
      console.log("`.grant` API MAY BE DELETED OR CHANGED OR RENAMED, DO NOT USE!");
      var gun = this, user = gun.back(-1).user(), pair = user.pair(), path = '';
      gun.back(function(at){ if(at.is){ return } path += (at.get||'') });
      (async function(){
      var enc, sec = await user.get('trust').get(pair.pub).get(path).then();
      sec = await SEA.decrypt(sec, pair);
      if(!sec){
        sec = SEA.random(16).toString();
        enc = await SEA.encrypt(sec, pair);
        user.get('trust').get(pair.pub).get(path).put(enc);
      }
      var pub = to.get('pub').then();
      var epub = to.get('epub').then();
      pub = await pub; epub = await epub;
      var dh = await SEA.secret(epub, pair);
      enc = await SEA.encrypt(sec, dh);
      user.get('trust').get(pub).get(path).put(enc, cb);
      }());
      return gun;
    }
    User.prototype.secret = function(data, cb){
      console.log("`.secret` API MAY BE DELETED OR CHANGED OR RENAMED, DO NOT USE!");
      var gun = this, user = gun.back(-1).user(), pair = user.pair(), path = '';
      gun.back(function(at){ if(at.is){ return } path += (at.get||'') });
      (async function(){
      var enc, sec = await user.get('trust').get(pair.pub).get(path).then();
      sec = await SEA.decrypt(sec, pair);
      if(!sec){
        sec = SEA.random(16).toString();
        enc = await SEA.encrypt(sec, pair);
        user.get('trust').get(pair.pub).get(path).put(enc);
      }
      enc = await SEA.encrypt(data, sec);
      gun.put(enc, cb);
      }());
      return gun;
    }
    module.exports = User
  })(USE, './create');

  ;USE(function(module){
    const SEA = USE('./sea')
    const Gun = SEA.Gun;
    // After we have a GUN extension to make user registration/login easy, we then need to handle everything else.

    // We do this with a GUN adapter, we first listen to when a gun instance is created (and when its options change)
    Gun.on('opt', function(at){
      if(!at.sea){ // only add SEA once per instance, on the "at" context.
        at.sea = {own: {}};
        at.on('in', security, at); // now listen to all input data, acting as a firewall.
        at.on('out', signature, at); // and output listeners, to encrypt outgoing data.
        at.on('node', each, at);
      }
      this.to.next(at); // make sure to call the "next" middleware adapter.
    });

    // Alright, this next adapter gets run at the per node level in the graph database.
    // This will let us verify that every property on a node has a value signed by a public key we trust.
    // If the signature does not match, the data is just `undefined` so it doesn't get passed on.
    // If it does match, then we transform the in-memory "view" of the data into its plain value (without the signature).
    // Now NOTE! Some data is "system" data, not user data. Example: List of public keys, aliases, etc.
    // This data is self-enforced (the value can only match its ID), but that is handled in the `security` function.
    // From the self-enforced data, we can see all the edges in the graph that belong to a public key.
    // Example: ~ASDF is the ID of a node with ASDF as its public key, signed alias and salt, and
    // its encrypted private key, but it might also have other signed values on it like `profile = <ID>` edge.
    // Using that directed edge's ID, we can then track (in memory) which IDs belong to which keys.
    // Here is a problem: Multiple public keys can "claim" any node's ID, so this is dangerous!
    // This means we should ONLY trust our "friends" (our key ring) public keys, not any ones.
    // I have not yet added that to SEA yet in this alpha release. That is coming soon, but beware in the meanwhile!
    function each(msg){ // TODO: Warning: Need to switch to `gun.on('node')`! Do not use `Gun.on('node'` in your apps!
      // NOTE: THE SECURITY FUNCTION HAS ALREADY VERIFIED THE DATA!!!
      // WE DO NOT NEED TO RE-VERIFY AGAIN, JUST TRANSFORM IT TO PLAINTEXT.
      var to = this.to, vertex = (msg.$._).put, c = 0, d;
      Gun.node.is(msg.put, function(val, key, node){
        // only process if SEA formatted?
        var tmp = Gun.obj.ify(val) || noop;
        if(u !== tmp[':']){
          node[key] = SEA.opt.unpack(tmp);
          return;
        }
        if(!SEA.opt.check(val)){ return }
        c++; // for each property on the node
        SEA.verify(val, false, function(data){ c--; // false just extracts the plain data.
          node[key] = SEA.opt.unpack(data, key, node);; // transform to plain value.
          if(d && !c && (c = -1)){ to.next(msg) }
        });
      });
      if((d = true) && !c){ to.next(msg) }
    }

    // signature handles data output, it is a proxy to the security function.
    function signature(msg){
      if((msg._||noop).user){
        return this.to.next(msg);
      }
      var ctx = this.as;
      (msg._||(msg._=function(){})).user = ctx.user;
      security.call(this, msg);
    }

    // okay! The security function handles all the heavy lifting.
    // It needs to deal read and write of input and output of system data, account/public key data, and regular data.
    // This is broken down into some pretty clear edge cases, let's go over them:
    function security(msg){
      var at = this.as, sea = at.sea, to = this.to;
      if(at.opt.faith && (msg._||noop).faith){ // you probably shouldn't have faith in this!
        this.to.next(msg); // why do we allow skipping security? I'm very scared about it actually.
        return; // but so that way storage adapters that already verified something can get performance boost. This was a community requested feature. If anybody finds an exploit with it, please report immediately. It should only be exploitable if you have XSS control anyways, which if you do, you can bypass security regardless of this.
      }
      if(msg.get){
        // if there is a request to read data from us, then...
        var soul = msg.get['#'];
        if(soul){ // for now, only allow direct IDs to be read.
          if(typeof soul !== 'string'){ return to.next(msg) } // do not handle lexical cursors.
          if('alias' === soul){ // Allow reading the list of usernames/aliases in the system?
            return to.next(msg); // yes.
          } else
          if('~@' === soul.slice(0,2)){ // Allow reading the list of public keys associated with an alias?
            return to.next(msg); // yes.
          } else { // Allow reading everything?
            return to.next(msg); // yes // TODO: No! Make this a callback/event that people can filter on.
          }
        }
      }
      if(msg.put){
        // potentially parallel async operations!!!
        var check = {}, each = {}, u;
        each.node = function(node, soul){
          if(Gun.obj.empty(node, '_')){ return check['node'+soul] = 0 } // ignore empty updates, don't reject them.
          Gun.obj.map(node, each.way, {soul: soul, node: node});
        };
        each.way = function(val, key){
          var soul = this.soul, node = this.node, tmp;
          if('_' === key){ return } // ignore meta data
          if('~@' === soul){  // special case for shared system data, the list of aliases.
            each.alias(val, key, node, soul); return;
          }
          if('~@' === soul.slice(0,2)){ // special case for shared system data, the list of public keys for an alias.
            each.pubs(val, key, node, soul); return;
          }
          if('~' === soul.slice(0,1) && 2 === (tmp = soul.slice(1)).split('.').length){ // special case, account data for a public key.
            each.pub(val, key, node, soul, tmp, (msg._||noop).user); return;
          }
          each.any(val, key, node, soul, (msg._||noop).user); return;
          return each.end({err: "No other data allowed!"});
        };
        each.alias = function(val, key, node, soul){ // Example: {_:#~@, ~@alice: {#~@alice}}
          if(!val){ return each.end({err: "Data must exist!"}) } // data MUST exist
          if('~@'+key === Gun.val.link.is(val)){ return check['alias'+key] = 0 } // in fact, it must be EXACTLY equal to itself
          each.end({err: "Mismatching alias."}); // if it isn't, reject.
        };
        each.pubs = function(val, key, node, soul){ // Example: {_:#~@alice, ~asdf: {#~asdf}}
          if(!val){ return each.end({err: "Alias must exist!"}) } // data MUST exist
          if(key === Gun.val.link.is(val)){ return check['pubs'+soul+key] = 0 } // and the ID must be EXACTLY equal to its property
          each.end({err: "Alias must match!"}); // that way nobody can tamper with the list of public keys.
        };
        each.pub = function(val, key, node, soul, pub, user){ var tmp; // Example: {_:#~asdf, hello:'world'~fdsa}}
          if('pub' === key){
            if(val === pub){ return (check['pub'+soul+key] = 0) } // the account MUST match `pub` property that equals the ID of the public key.
            return each.end({err: "Account must match!"});
          }
          check['user'+soul+key] = 1;
          if(Gun.is(msg.$) && user && user.is && pub === user.is.pub){
            SEA.sign(SEA.opt.prep(tmp = SEA.opt.parse(val), key, node, soul), (user._).sea, function(data){ var rel;
              if(u === data){ return each.end({err: SEA.err || 'Pub signature fail.'}) }
              if(rel = Gun.val.link.is(val)){
                (at.sea.own[rel] = at.sea.own[rel] || {})[pub] = true;
              }
              node[key] = JSON.stringify({':': SEA.opt.unpack(data.m), '~': data.s});
              check['user'+soul+key] = 0;
              each.end({ok: 1});
            }, {check: SEA.opt.pack(tmp, key, node, soul), raw: 1});
            return;
          }
          SEA.verify(SEA.opt.pack(val,key,node,soul), pub, function(data){ var rel, tmp;
            data = SEA.opt.unpack(data, key, node);
            if(u === data){ // make sure the signature matches the account it claims to be on.
              return each.end({err: "Unverified data."}); // reject any updates that are signed with a mismatched account.
            }
            if((rel = Gun.val.link.is(data)) && pub === SEA.opt.pub(rel)){
              (at.sea.own[rel] = at.sea.own[rel] || {})[pub] = true;
            }
            check['user'+soul+key] = 0;
            each.end({ok: 1});
          });
        };
        each.any = function(val, key, node, soul, user){ var tmp, pub;
          if(!(pub = SEA.opt.pub(soul))){
            if(at.opt.secure){
              each.end({err: "Soul is missing public key at '" + key + "'."});
              return;
            }
            // TODO: Ask community if should auto-sign non user-graph data.
            check['any'+soul+key] = 1;
            at.on('secure', function(msg){ this.off();
              check['any'+soul+key] = 0;
              if(at.opt.secure){ msg = null }
              each.end(msg || {err: "Data cannot be modified."});
            }).on.on('secure', msg);
            //each.end({err: "Data cannot be modified."});
            return;
          }
          if(Gun.is(msg.$) && user && user.is && pub === user.is.pub){
            /*var other = Gun.obj.map(at.sea.own[soul], function(v, p){
              if((user.is||{}).pub !== p){ return p }
            });
            if(other){
              each.any(val, key, node, soul);
              return;
            }*/
            check['any'+soul+key] = 1;
            SEA.sign(SEA.opt.prep(tmp = SEA.opt.parse(val), key, node, soul), (user._).sea, function(data){
              if(u === data){ return each.end({err: 'My signature fail.'}) }
              node[key] = JSON.stringify({':': SEA.opt.unpack(data.m), '~': data.s});
              check['any'+soul+key] = 0;
              each.end({ok: 1});
            }, {check: SEA.opt.pack(tmp, key, node, soul), raw: 1});
            return;
          }
          check['any'+soul+key] = 1;
          SEA.verify(SEA.opt.pack(val,key,node,soul), pub, function(data){ var rel;
            data = SEA.opt.unpack(data, key, node);
            if(u === data){ return each.end({err: "Mismatched owner on '" + key + "'."}) } // thanks @rogowski !
            if((rel = Gun.val.link.is(data)) && pub === SEA.opt.pub(rel)){
              (at.sea.own[rel] = at.sea.own[rel] || {})[pub] = true;
            }
            check['any'+soul+key] = 0;
            each.end({ok: 1});
          });
        }
        each.end = function(ctx){ // TODO: Can't you just switch this to each.end = cb?
          if(each.err){ return }
          if((each.err = ctx.err) || ctx.no){
            console.log('NO!', each.err, msg.put); // 451 mistmached data FOR MARTTI
            return;
          }
          if(!each.end.ed){ return }
          if(Gun.obj.map(check, function(no){
            if(no){ return true }
          })){ return }
          (msg._||{}).user = at.user || security; // already been through firewall, does not need to again on out.
          to.next(msg);
        };
        Gun.obj.map(msg.put, each.node);
        each.end({end: each.end.ed = true});
        return; // need to manually call next after async.
      }
      to.next(msg); // pass forward any data we do not know how to handle or process (this allows custom security protocols).
    }
    SEA.opt.pub = function(s){
      if(!s){ return }
      s = s.split('~');
      if(!s || !(s = s[1])){ return }
      s = s.split('.');
      if(!s || 2 > s.length){ return }
      s = s.slice(0,2).join('.');
      return s;
    }
    SEA.opt.prep = function(d,k, n,s){ // prep for signing
      return {'#':s,'.':k,':':SEA.opt.parse(d),'>':Gun.state.is(n, k)};
    }
    SEA.opt.pack = function(d,k, n,s){ // pack for verifying
      if(SEA.opt.check(d)){ return d }
      var meta = (Gun.obj.ify(d)||noop), sig = meta['~'];
      return sig? {m: {'#':s,'.':k,':':meta[':'],'>':Gun.state.is(n, k)}, s: sig} : d;
    }
    SEA.opt.unpack = function(d, k, n){ var tmp;
      if(u === d){ return }
      if(d && (u !== (tmp = d[':']))){ return tmp }
      if(!k || !n){ return }
      if(d === n[k]){ return d }
      if(!SEA.opt.check(n[k])){ return d }
      var soul = Gun.node.soul(n), s = Gun.state.is(n, k);
      if(d && 4 === d.length && soul === d[0] && k === d[1] && fl(s) === fl(d[3])){
        return d[2];
      }
      if(s < SEA.opt.shuffle_attack){
        return d;
      }
    }
    SEA.opt.shuffle_attack = 1546329600000; // Jan 1, 2019
    var noop = function(){}, u;
    var fl = Math.floor; // TODO: Still need to fix inconsistent state issue.
    var rel_is = Gun.val.rel.is;
    // TODO: Potential bug? If pub/priv key starts with `-`? IDK how possible.

  })(USE, './index');
}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":2}],7:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],8:[function(require,module,exports){
/**
 * Secure random string generator with custom alphabet.
 *
 * Alphabet must contain 256 symbols or less. Otherwise, the generator
 * will not be secure.
 *
 * @param {generator} random The random bytes generator.
 * @param {string} alphabet Symbols to be used in new random string.
 * @param {size} size The number of symbols in new random string.
 *
 * @return {string} Random string.
 *
 * @example
 * const format = require('nanoid/format')
 *
 * function random (size) {
 *   const result = []
 *   for (let i = 0; i < size; i++) {
 *     result.push(randomByte())
 *   }
 *   return result
 * }
 *
 * format(random, "abcdef", 5) //=> "fbaef"
 *
 * @name format
 * @function
 */
module.exports = function (random, alphabet, size) {
  var mask = (2 << Math.log(alphabet.length - 1) / Math.LN2) - 1
  var step = Math.ceil(1.6 * mask * size / alphabet.length)

  var id = ''
  while (true) {
    var bytes = random(step)
    for (var i = 0; i < step; i++) {
      var byte = bytes[i] & mask
      if (alphabet[byte]) {
        id += alphabet[byte]
        if (id.length === size) return id
      }
    }
  }
}

/**
 * @callback generator
 * @param {number} bytes The number of bytes to generate.
 * @return {number[]} Random bytes.
 */

},{}],9:[function(require,module,exports){
'use strict';
module.exports = require('./lib/index');

},{"./lib/index":13}],10:[function(require,module,exports){
'use strict';

var randomFromSeed = require('./random/random-from-seed');

var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
var alphabet;
var previousSeed;

var shuffled;

function reset() {
    shuffled = false;
}

function setCharacters(_alphabet_) {
    if (!_alphabet_) {
        if (alphabet !== ORIGINAL) {
            alphabet = ORIGINAL;
            reset();
        }
        return;
    }

    if (_alphabet_ === alphabet) {
        return;
    }

    if (_alphabet_.length !== ORIGINAL.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
    }

    var unique = _alphabet_.split('').filter(function(item, ind, arr){
       return ind !== arr.lastIndexOf(item);
    });

    if (unique.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
    }

    alphabet = _alphabet_;
    reset();
}

function characters(_alphabet_) {
    setCharacters(_alphabet_);
    return alphabet;
}

function setSeed(seed) {
    randomFromSeed.seed(seed);
    if (previousSeed !== seed) {
        reset();
        previousSeed = seed;
    }
}

function shuffle() {
    if (!alphabet) {
        setCharacters(ORIGINAL);
    }

    var sourceArray = alphabet.split('');
    var targetArray = [];
    var r = randomFromSeed.nextValue();
    var characterIndex;

    while (sourceArray.length > 0) {
        r = randomFromSeed.nextValue();
        characterIndex = Math.floor(r * sourceArray.length);
        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
    }
    return targetArray.join('');
}

function getShuffled() {
    if (shuffled) {
        return shuffled;
    }
    shuffled = shuffle();
    return shuffled;
}

/**
 * lookup shuffled letter
 * @param index
 * @returns {string}
 */
function lookup(index) {
    var alphabetShuffled = getShuffled();
    return alphabetShuffled[index];
}

function get () {
  return alphabet || ORIGINAL;
}

module.exports = {
    get: get,
    characters: characters,
    seed: setSeed,
    lookup: lookup,
    shuffled: getShuffled
};

},{"./random/random-from-seed":16}],11:[function(require,module,exports){
'use strict';

var generate = require('./generate');
var alphabet = require('./alphabet');

// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
// This number should be updated every year or so to keep the generated id short.
// To regenerate `new Date() - 0` and bump the version. Always bump the version!
var REDUCE_TIME = 1459707606518;

// don't change unless we change the algos or REDUCE_TIME
// must be an integer and less than 16
var version = 6;

// Counter is used when shortid is called multiple times in one second.
var counter;

// Remember the last time shortid was called in case counter is needed.
var previousSeconds;

/**
 * Generate unique id
 * Returns string id
 */
function build(clusterWorkerId) {
    var str = '';

    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

    if (seconds === previousSeconds) {
        counter++;
    } else {
        counter = 0;
        previousSeconds = seconds;
    }

    str = str + generate(version);
    str = str + generate(clusterWorkerId);
    if (counter > 0) {
        str = str + generate(counter);
    }
    str = str + generate(seconds);
    return str;
}

module.exports = build;

},{"./alphabet":10,"./generate":12}],12:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var random = require('./random/random-byte');
var format = require('nanoid/format');

function generate(number) {
    var loopCounter = 0;
    var done;

    var str = '';

    while (!done) {
        str = str + format(random, alphabet.get(), 1);
        done = number < (Math.pow(16, loopCounter + 1 ) );
        loopCounter++;
    }
    return str;
}

module.exports = generate;

},{"./alphabet":10,"./random/random-byte":15,"nanoid/format":8}],13:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var build = require('./build');
var isValid = require('./is-valid');

// if you are using cluster or multiple servers use this to make each instance
// has a unique value for worker
// Note: I don't know if this is automatically set when using third
// party cluster solutions such as pm2.
var clusterWorkerId = require('./util/cluster-worker-id') || 0;

/**
 * Set the seed.
 * Highly recommended if you don't want people to try to figure out your id schema.
 * exposed as shortid.seed(int)
 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
 */
function seed(seedValue) {
    alphabet.seed(seedValue);
    return module.exports;
}

/**
 * Set the cluster worker or machine id
 * exposed as shortid.worker(int)
 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
 * returns shortid module so it can be chained.
 */
function worker(workerId) {
    clusterWorkerId = workerId;
    return module.exports;
}

/**
 *
 * sets new characters to use in the alphabet
 * returns the shuffled alphabet
 */
function characters(newCharacters) {
    if (newCharacters !== undefined) {
        alphabet.characters(newCharacters);
    }

    return alphabet.shuffled();
}

/**
 * Generate unique id
 * Returns string id
 */
function generate() {
  return build(clusterWorkerId);
}

// Export all other functions as properties of the generate function
module.exports = generate;
module.exports.generate = generate;
module.exports.seed = seed;
module.exports.worker = worker;
module.exports.characters = characters;
module.exports.isValid = isValid;

},{"./alphabet":10,"./build":11,"./is-valid":14,"./util/cluster-worker-id":17}],14:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

function isShortId(id) {
    if (!id || typeof id !== 'string' || id.length < 6 ) {
        return false;
    }

    var nonAlphabetic = new RegExp('[^' +
      alphabet.get().replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&') +
    ']');
    return !nonAlphabetic.test(id);
}

module.exports = isShortId;

},{"./alphabet":10}],15:[function(require,module,exports){
'use strict';

var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

var randomByte;

if (!crypto || !crypto.getRandomValues) {
    randomByte = function(size) {
        var bytes = [];
        for (var i = 0; i < size; i++) {
            bytes.push(Math.floor(Math.random() * 256));
        }
        return bytes;
    };
} else {
    randomByte = function(size) {
        return crypto.getRandomValues(new Uint8Array(size));
    };
}

module.exports = randomByte;

},{}],16:[function(require,module,exports){
'use strict';

// Found this seed-based random generator somewhere
// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

var seed = 1;

/**
 * return a random number based on a seed
 * @param seed
 * @returns {number}
 */
function getNextValue() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed/(233280.0);
}

function setSeed(_seed_) {
    seed = _seed_;
}

module.exports = {
    nextValue: getNextValue,
    seed: setSeed
};

},{}],17:[function(require,module,exports){
'use strict';

module.exports = 0;

},{}],18:[function(require,module,exports){
module.exports = {
    Database: require('./modules/data/database.js'),
    Item: require('./modules/data/item.js'),
    Organization: require('./modules/data/organization.js'),
    Package: require('./modules/data/package.js'),
    User: require('./modules/data/user.js'),
    Query: require('./modules/data/query.js')
}

},{"./modules/data/database.js":21,"./modules/data/item.js":22,"./modules/data/organization.js":23,"./modules/data/package.js":24,"./modules/data/query.js":25,"./modules/data/user.js":26}],19:[function(require,module,exports){
Array.prototype.remove = function () {
    var what; var a = arguments; var L = a.length; var ax
    while (L && this.length) {
        what = a[--L]
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1)
        }
    }
    return this
}

Array.prototype.getIndexForObjectWithKey = function (key, value) {
    for (var idx in this) {
        var item = this[idx]
        if (item.hasOwnProperty(key) && item[key] === value) {
            return idx
        }
    }
}

},{}],20:[function(require,module,exports){
String.prototype.truncate = function (strLen, separator) {
    if (this.length <= strLen) return this

    separator = separator || '...'

    var sepLen = separator.length

    var charsToShow = strLen - sepLen

    var frontChars = Math.ceil(charsToShow / 2)

    var backChars = Math.floor(charsToShow / 2)

    return this.substr(0, frontChars) +
           separator +
           this.substr(this.length - backChars)
}

},{}],21:[function(require,module,exports){
const EventEmitter = require('event-emitter-es6')
const Gun = require('gun')
require('../../helpers/string')
const rel_ = Gun.val.rel._ // '#'
const node_ = Gun.node._ // '_'

require('../../../node_modules/gun/nts')

Gun.chain.unset = function (node) {
    this.put({ [node[node_].put[node_][rel_]]: null })
    return this
}

module.exports = class Database extends EventEmitter {
    constructor (uri) {
        super()

        let self = this

        this.uri = uri
        this.namespace = '__LX__'
        this.token = null

        // attach validation
        Gun.on('opt', function (opt) {
            if (opt.once) {
                return
            }
            opt.on('out', function (msg) {
                let to = this.to
                // Adds headers for put
                msg.headers = {
                    token: self.token
                }
                to.next(msg) // pass to next middleware
            })

            opt.on('in', function (msg) {
                if (msg.hasOwnProperty('put') && msg.hasOwnProperty('><')) {
                    self.emit('sync', msg)
                }
                this.to.next(msg)
            })
        })

        this.stor = Gun(this.uri) // database instance
        this.node = this.stor.get(this.namespace) // root node
    }

    // -------------------------------------------------------------------------
    get logPrefix () {
        return `[database]`.padEnd(20, ' ')
    }

    // -------------------------------------------------------------------------
    /**
    * Get node from within root namespace
    */
    get () {
        return this.node.get.apply(this.node, arguments)
    }

    /**
    * Sets value from within root namespace
    */
    put () {
        return this.node.put.apply(this.node, arguments)
    }

    /*
    * Ensures a single node is created within the database
    */
    getOrPut (targetNode, val) {
        return new Promise((resolve, reject) => {
            targetNode.once((v, k) => {
                if (v) {
                    // console.log(`${this.logPrefix} skip put for existing node`, targetNode)
                    if (typeof (v) === 'string' && v.length) {
                        return resolve(false)
                    } else if (typeof (v) === 'number') {
                        return resolve(false)
                    } else if (typeof (v) === 'object') {
                        let keys = Object.keys(v).filter(key => (key !== '_' && key !== '#'))
                        if (keys.length) {
                            return resolve(false)
                        }
                    }
                }
                if (typeof (val) === 'object') {
                    // creates a node we can save to
                    targetNode.put({})
                    targetNode.put(val).once((v, k) => {
                        // won't ack an empty {} but will prepare database
                        // for a future write to this sub-node
                        console.log(`${this.logPrefix} node put callback`, v)
                        resolve(true)
                    })
                } else {
                    // otherwise do create the node
                    targetNode.put(val)
                        .once((v, k) => {
                            resolve(true)
                        })
                }
            })
        })
    }

    // -------------------------------------------------------------------------
    /**
    * Prints out value of a node selected by a path/to/node
    */
    print (path, pointer, node) {
        // recursive attempt to narrow down to target node
        if (!pointer) pointer = path
        if (!node) node = this.node
        let split = pointer.split('/')
        node.get(split[0]).once((v, k) => {
            if (split.length > 1) {
                let newPointer = split.slice(1).join('/')
                node = node.get(k)
                this.print(path, newPointer, node)
            } else {
                // we reached the target node here
                console.log('[DB]' + path + ' = ', v)
            }
        })
        return split.length
    }

    /**
    * Output basic node on .once or .map
    */
    log (v, k) {
        if (!k) {
            // assume get request
            this.get(v).once((v, k) => {
                return this.log(v, k)
            })
        } else {
            let pre = this.logPrefix || '[database]'
            if (v && typeof (v) === 'object') {
                console.log(`${pre} ${k} =`)
                Object.keys(v).forEach((key) => {
                    console.log(`${pre}     ${key}:`, v[key])
                })
            } else {
                console.log(`${pre} ${k} =`, v)
            }
        }
    }

    /**
    *  Print out the graph structure of a specified node
    */
    inspect (showDeleted, json, level) {
        let self = this
        if (!json) {
            return self.jsonify().then((newJSON) => {
                this.inspect(showDeleted, newJSON, level)
            })
        }

        level = level || ''

        Object.keys(json).forEach(k => {
            if (k === '#') return

            let v = json[k]

            // printable value
            let vp = v
            if (typeof (v) === 'String') {
                vp = v.truncate(30)
            }

            if (v === null) {
                if (showDeleted) {
                    console.log(`${level}[ø] ${k}`)
                }
            } else if (typeof (v) === 'object') {
                console.log(`${level}[+] ${k}`)
                self.inspect(showDeleted, v, level + '  ')
            } else {
                console.log(`${level}|- ${k} = `, vp)
            }
        })
    }

    /**
    * Exports data structure to a basic JSON object with hierarchy
    */
    jsonify (node, tree, pointer) {
        let self = this
        node = node || self.node
        tree = tree || {}
        pointer = pointer || tree

        return new Promise((resolve, reject) => {
            if (!node) {
                return reject('Root node missing')
            }

            node.once((v, k) => {
                pointer[k] = {}
                let promises = []
                if (v) {
                    let items = Object.keys(v).filter(key => key !== '_')
                    items.forEach((item) => {
                        var promise
                        let val = v[item]

                        if (val !== null && typeof (val) === 'object') {
                            promise = self.jsonify.apply(self, [node.get(item), tree, pointer[k]])
                        } else {
                            promise = pointer[k][item] = val
                        }
                        promises.push(promise)
                    })
                }

                Promise.all(promises).then((val) => {
                    resolve(tree)
                })
            })
        })
    };
}

},{"../../../node_modules/gun/nts":5,"../../helpers/string":20,"event-emitter-es6":3,"gun":4}],22:[function(require,module,exports){
const EventEmitter = require('event-emitter-es6')
const shortid = require('shortid')

module.exports = class Item extends EventEmitter {
    constructor (pkg, defaults) {
        if (!pkg || pkg.constructor.name !== 'Package') {
            throw new Error('Requires package to be defined')
        }
        super()
        this.id = null
        this.package = pkg

        // create data space for data we allow to be exported to shared database
        this._data = {}
        this._new = {}

        // always include these defaults
        let globalDefaults = {
            'owner': ['o'],
            'editors': ['e', []],
            'viewers': ['v', []],
            'form': ['f', []],
            'notes': ['n', []],
            'tags': ['t', []],
            'signatures': ['@', []]
        }

        this._defaults = Object.assign(globalDefaults, defaults)

        for (var idx in this._defaults) {
            this._data[idx] = this._defaults[idx][1] || null
            this._new[idx] = false
        }

        this._key_table = {}
        this._key_table_reverse = {}
        for (var idy in this._defaults) {
            this._key_table[idy] = this._defaults[idy][0]
            this._key_table_reverse[this._defaults[idy][0]] = idy
        }

        return this
    }

    // -------------------------------------------------------------------------
    inspect () {
        console.log(`${this.logPrefix} data = ${JSON.stringify(this._data)}`)
        console.log(this)
    }

    get logPrefix () {
        return `[i:${this.id}]`.padEnd(20, ' ')
    }

    // ------------------------------------------------------------------- DATA
    get data () {
        return this._data
    }

    set data (val) {
        if (val) {
            let unpackagedData = this.unpack(val)
            Object.keys(unpackagedData).forEach((key) => {
                let val = unpackagedData[key]

                // basic check for expected type
                if (this._defaults[key][1] === []) {
                    // expects to be an array
                    if (val.constructor !== Array) {
                        console.log(`${this.logPrefix} skip set of unexpected value for ${key} = `, val)
                        return
                    }
                }

                this._data[key] = val
                if (this._new[key] == val) {
                    delete this._new[key]
                }
            })
        }
    }

    // ------------------------------------------------------------------- OWNER
    /**
    * User that created this item / has primary control of this item
    */
    get owner () {
        return this._data.owner
    }

    /**
    * Defines the owner for this item
    */
    set owner (val) {
        if (!val) return
        if (val !== this._data.owner) {
            this._data.owner = val
            this._new.owner = true
        }
    }

  // ----------------------------------------------------------------- NOTES
    /**
    * Gets a list of all notes
    */
    get notes () {
        return this._data.notes
    }

    /**
    * Sets the entire list of editors for this item
    */
    set notes (val) {
        if (val === null || val === undefined) return

        // always clear out notes when assigning new ones
        this._data.notes.forEach(txt => {
            this.removeNote(txt)
        })
        this._new.notes = true

        if (typeof (val) === 'object') {
            val.forEach(this.note.bind(this))
        }
        else if (typeof (val) === 'string' && val) {
            this._data.notes.push(val)
        }
    }

    /**
    * Adds a new note to the item
    */
    note (val) {
        if (!val) return
        if (this._data.notes.indexOf(val) > -1) {
            return
        }
        this._data.notes.push(val)
        this._new.notes = true
        this.emit('note', val)
    }

    /**
    * Remove note
    */
    removeNote (txt) {
        if (!txt) return
        this._data.notes.remove(txt)
        this.emit('note-removed', txt)
        this._new.notes = true
        return this.notes
    }
 // ----------------------------------------------------------------- VIEWERS
    /**
    * Gets a list of all item viewers
    */
    get viewers () {
        return this._data.viewers
    }

    /**
    * Sets the entire list of viewers for this item
    */
    set viewers (val) {
        if (!val || val.length === 0) return

        if (typeof (val) === 'object') {
            val.forEach(this.viewer.bind(this))
        }
    }

    /**
    * Adds a new editor to the item
    */
    viewer (val) {
        if (!val) return
        if (this._data.viewers.indexOf(val) > -1) {
            return
        }
        this._data.viewers.push(val)
        this._new.viewers = true
        this.emit('viewer', val)
    }

    /**
    * Remove note
    */
    removeViewer (username) {
        if (!username) return
        this._data.viewers.remove(username)
        this.emit('viewer-removed', username)
        this._new.viwers = true
        return this.viewers
    }
    // ----------------------------------------------------------------- EDITORS
    /**
    * Gets a list of all item editors
    */
    get editors () {
        return this._data.editors
    }

    /**
    * Sets the entire list of editors for this item
    */
    set editors (val) {
        if (!val || val.length === 0) return

        if (typeof (val) === 'object') {
            val.forEach(this.editor.bind(this))
        }
    }

    /**
    * Adds a new editor to the item
    */
    editor (val) {
        if (!val) return
        if (this._data.editors.indexOf(val) > -1) {
            return
        }
        this._data.editors.push(val)
        this._new.editors = true
        this.emit('editor', val)
    }

    // ------------------------------------------------------------------- SIGNATURES
    get signatures () {
        return this._data.signatures
    }

    set signatures (val) {
        if (!val || val.constructor !== Array) return
        if (val.toString() != this._data.signatures.toString()) {
            this._data.signatures = val
            this._new.signatures = true
        }
    }

    // -------------------------------------------------------------------- TAGS
    /**
    * Gets a list of all tags, often used to alter per-app display or logic
    */
    get tags () {
        if (this._data.tags && typeof (this._data.tags) === 'object') {
            return this._data.tags
        } else {
            return []
        }
    }

    /**
    * Sets the entire list of tags with specified array
    */
    set tags (val) {
        if (!val || val.length === 0) return

        if (typeof (val) === 'object') {
            val.forEach(this.tag.bind(this))
        }
    }

    /**
    * Add tag for data filtering and user interface display
    */
    tag (tag) {
        if (!tag) return
        tag = this.sanitizeTag(tag)

        this._data.tags = this._data.tags || []
        // console.log(`${this.logPrefix} tag = `, tag);

        // don't allow duplicate tags
        if (this._data.tags.indexOf(tag) > -1) {
            return
        }

        this._new.tags = true
        this._data.tags.push(tag)
        this.emit('tag', tag)
        return this.tags
    }

    /**
    * Remove tag
    */
    untag (tag) {
        if (!tag) return
        tag = this.sanitizeTag(tag)
        this._data.tags.remove(tag)
        this.emit('untag', tag)
        this._new.tags = true
        return this.tags
    }

    /**
    * Remove all tags
    */
    untagAll () {
        this._data.tags.forEach((tag) => {
            this.emit('untag', tag)
        })
        this._data.tags = []
        this._new.tags = true
        return this.tags
    }

    /**
    * Keep tags lowercase and with dash seperators
    */
    sanitizeTag (tag) {
        return tag.toLowerCase().replace(/[^a-z0-9\-]+/g, '')
    }

    // -------------------------------------------------------------------------
    /**
    * Compresses and formats data for storage in shared database
    *
    * Requires that all data variables are pre-defined in our map for safety
    */
    pack (obj) {
        let newObj = {}
        for (var idx in obj) {
            let v = obj[idx]

            if (v === undefined || v === null) {
                // nothing worth sending over the wire
            } else if (this._key_table.hasOwnProperty(idx)) {
                let k = this._key_table[idx]
                if (v && v.constructor === Array) {
                    if (v.length) {
                        newObj[k] = '%' + v.join(',')
                    } else if (this._new[idx]) {
                        // empty array, all items have been removed
                        newObj[k] = '%'
                    }
                } else {
                    newObj[k] = v
                }
            }
        }
        // console.log(`${this.logPrefix} Packed:`, obj, newObj);
        return newObj
    }

    /**
    * Extracts data from shared database and places back in javascript object
    *
    * Requires that all data variables are pre-defined in our map for safety
    */
    unpack (obj) {
        let newObj = {}
        Object.keys(obj).forEach(idx => {
            let v = obj[idx]

            if (this._key_table_reverse.hasOwnProperty(idx)) {
                let k = this._key_table_reverse[idx]

                if (typeof (v) === 'string') {
                    if (v[0] === 'Å') {
                        // @todo this is deprecated. remove later...
                        v = v.replace('Å', '%')
                    }
                    if (v[0] === '%') {
                        // this is an array. expand it...
                        v = v.replace('%', '').split(',')
                        if (v == '') {
                            // empty array
                            v = []
                        }
                    }
                }

                // basic check for expected type
                if (this._defaults[k][1]) {
                    // expects to be an array
                    if (v.constructor !== Array) {
                        // default value
                        console.log(`${this.logPrefix} use default rather than unexpected value for ${k} = `, v)
                        v = this._defaults[k][1]
                        return
                    }
                }

                newObj[k] = v
            }
        })

        // console.log(`${this.logPrefix} Unpacked:`, obj, newObj);
        return newObj
    }

    /*
    * Updates the local item with packed data
    */
    refresh (data) {
        let newData = this.unpack(data)
        // only access approved data keys from our map
        // only listen for changes when we have a getter/setter pair
        for (var idx in newData) {
            let pointer = this[idx] || this._data[idx] // try to use a getter if available
            if (JSON.stringify(pointer) !== JSON.stringify(newData[idx])) {

                if (typeof (pointer) === 'object') {
                    console.log(`${this.logPrefix} changing ${idx} object to ${newData[idx]}`)
                } else {
                    console.log(`${this.logPrefix} changing ${idx} from ${this[idx]} to ${newData[idx]}`)
                }

                // default to use setter if available
                if (this[idx]) {
                    this[idx] = newData[idx]
                } else {
                    this._data[idx] = newData[idx]
                }


                this.emit('change', idx)

            }
        }
    }

    // -------------------------------------------------------------------------

    // @todo look at parent packages and then increase sequence count

    /**
    * Stores the composed item into a decentralized database
    */
    save (fields) {
        return new Promise((resolve, reject) => {
            // if we have fields to work with, update existing object
            if (fields) {
                return this.update(fields).then(resolve).catch(reject)
            }

            // save to our shared database...
            let obj = this.pack(this._data)

            console.log(`${this.logPrefix} about to save new item`)


            // @todo remove work-around once ack properly returns
            // data is saved properly but fails to properly ack
            const onRemoteSave = ack => {
                if (ack.err) {
                    console.warn(`${this.logPrefix} no ack for save`)
                    // return reject(new Error('save_failed'))
                } else {
                    this.emit('save-remote', obj)
                    console.log(`${this.logPrefix} saved to remote storage in package ${this.package.id}`, obj)
                }
            }

            const onLocalSave = (v, k) => {
                // @todo switch to ack once bug is fixed where ack returns a false error
                this.id = k
                // saves locally but we want confirmation from ack
                console.log(`${this.logPrefix} saved to local storage in package ${this.package.id}`, obj)

                // clear new state once saved
                Object.keys(this._new).forEach((item) => {
                    this._new[item] = false
                })

                // database assigns unique identifier
                this.package.seqUp()
                this.emit('save', obj)
                resolve(v)
            }

            if (this.id) {
                // use existing identifier if available
                this.package.node.get('items').get(this.id).put(obj, onRemoteSave).once(onLocalSave)
            }
            else {
                this.package.node.get('items').set(obj, onRemoteSave).once(onLocalSave)
            }
        })
    }

    /**
    * Updates only specific fields for an item
    */
    update (fields) {
        return new Promise((resolve, reject) => {
            // require an array of fields
            if (fields.constructor === String) {
                fields = [fields]
            }
            else if (fields.constructor !== Array) {
                console.log(`${this.logPrefix} Update requires fields in array format: ${fields}`)
                let err = new Error()
                err.name = 'update_failed_invalid_fields'
                err.message = JSON.stringify(fields)
                return reject(err)
            }

            let data = {}
            if (fields.constructor === Array) {
                fields.forEach((field) => {
                    // make sure we have an update for this field before saving
                    // prevents extraneous data sent over network
                    if (this._new[field]) {
                        data[field] = this._data[field]
                    }
                })
            } else if (typeof (fields) === 'string') {
                data[fields] = this._data[fields]
            }

            let itemsNode = this.package.node.get('items')
            let obj = this.pack(data)


            // @todo remove work-around once ack properly returns
            // data is saved properly but fails to properly ack
            const onRemoteUpdate = ack => {
                // @todo switch to ack once bug is fixed where ack returns a false error
                if (ack.err) {
                    console.log(`${this.logPrefix} no ack for update`)
                    let err = new Error()
                    err.name = 'update_failed'
                    err.message = fields.join(', ')
                    // return reject(err)
                } else {
                    this.emit('update-remote', fields)
                    console.log(`${this.logPrefix} updated at remote storage in package ${this.package.id}`, obj)
                }
            }

            const onLocalUpdate = (v,k) => {
                console.log(`${this.logPrefix} updated at local storage in package ${this.package.id}`, obj)
                fields.forEach((field) => {
                    this._new[field] = false
                })
                this.package.seqUp()
                this.emit('update', fields)
                return resolve()
            }

            let item = itemsNode.get(this.id)
            item.put(obj, onRemoteUpdate).once(onLocalUpdate)
        })
    }

    /**
    * Clears the value of the item and nullifies in database (full delete not possible)
    */
    drop () {
        return new Promise((resolve, reject) => {
            // do not operate on locked items

            let item = this.package.getOneItem(this.id)

            item.once((v, k) => {
                if (!v) {
                    // already dropped
                    console.log(`${this.logPrefix} already dropped`)
                    return resolve()
                }

                item.put(null, (ack) => {
                    if (ack.err) {
                        return reject(new Error('drop_failed'))
                    }
                    console.log(`${this.logPrefix} dropped`)
                    this.package.seqUp()
                    this.emit('drop')
                    return resolve()
                })
            })
        })
    }

    /**
    * Takes the item stored in a package and links it into another part of the graph
    */ 
    link (node) {
        node.once((v,k) => {
            if (!v) {
                let nodeInPackage = this.package.node.get('items').get(this.id)
                node.put(nodeInPackage)
            }
        })
    }
    // -------------------------------------------------------------------------
    /**
    * Add your trust to this item
    */
    approve (sig) {
        if (this._data.signatures.indexOf(sig) === -1) {
            this._data.signatures.push(sig)
            this._new.signatures = true
        }
        return this.update(['signatures'])
    }

    /**
    * Dispute item accuracy
    */
    dispute (sig) {
        if (this._data.signatures.indexOf(sig) !== -1) {
            this._data.signatures.remove(sig)
            this._new.signatures = true
        }
        return this.update(['signatures'])
    }

    hasSignature (sig) {
        return this._data.signatures && this._data.signatures.indexOf(sig) !== -1
    }
}

},{"event-emitter-es6":3,"shortid":9}],23:[function(require,module,exports){
const EventEmitter = require('event-emitter-es6')

module.exports = class Organization extends EventEmitter {
    constructor (id, name, db) {
        super()
        if (!id) {
            return console.error('[Organization] requires id to construct')
        }

        if (!name) {
            return console.error(`[Organiation] please name your organization`)
        }

        if (!db || db.constructor.name !== 'Database') {
            return console.error('[Organization] requires database to construct')
        }

        this.id = id
        this.db = db
        this._data = {
            'name': name,
            'members': {},
            'packages': {}
        }
        this.node = this.db.get('org').get(this.id)
    }

    // -------------------------------------------------------------------------
    get logPrefix () {
        return `[o:${this.id || 'Organization'}]`.padEnd(20, ' ')
    }

    get name () {
        return this._data.name
    }

    set name (val) {
        this._data.name = val
    }

    // -------------------------------------------------------------------------

    /**
    * Publish a new data package to the network
    */
    save () {
        return this.db.getOrPut(this.node, this._data)
            .then((saved) => {
                if (saved) {
                    console.info(`${this.logPrefix} save`, this.name)
                    this.emit('save')
                } else {
                    // console.info(`${this.logPrefix} already saved`, this.name)
                }
            })
    }

    drop () {
        return new Promise((resolve, reject) => {
            this.db.get('org').get(this.id)
                .put(null)
                .once((v, k) => {
                    console.log(`${this.logPrefix} dropped ${this.id}`)
                    this.emit('drop')
                    return resolve(v)
                })
        })
    }

    // -------------------------------------------------------------------------
    /**
    * Claim ownership over package
    */
    claim (pkg) {
        if (!pkg.node) {
            return Promise.reject(new Error('org_claim_missing_package_node'))
        }
        // first, link organization into package
        return this.db.getOrPut(this.node.get('packages'), {})
            .then((saved) => {
                // console.log(`${this.logPrefix} ${saved ? 'linked' : 'already linked'} ${pkg.id}`)

                this.node.get('packages').set(pkg.node)

                return this.db.getOrPut(pkg.node.get('organization'), this.node)
                    .then((saved) => {
                        // console.log(`${this.logPrefix} ${saved ? 'claimed' : 'already claimed'} ${pkg.id}`)
                    })
            })
    }

    // -------------------------------------------------------------------------
    /**
    * Add member user to the organization
    */
    addOneMember (user) {
        return new Promise((resolve, reject) => {
            this.node.get('members')
                .set(user)
                .once(resolve)
        })
    }

    /**
    * Remove member user from the organization
    */
    removeOneMember (user) {
        return new Promise((resolve, reject) => {
            this.node.get('members')
                .unset(user)
                .once(resolve)
        })
    }
}

},{"event-emitter-es6":3}],24:[function(require,module,exports){
const EventEmitter = require('event-emitter-es6')

module.exports = class Package extends EventEmitter {
    constructor (name, db) {
        super()

        if (!name) {
            console.error(`${this.logPrefix} please name your package to publish`)
            throw new Error('missing_name')
        }

        if (!db || db.constructor.name !== 'Database') {
            return console.error('Package requires database to construct')
        }
        this.db = db
        this.version = '0.0.1' // default version
        if (name.indexOf('@') !== -1) {
            let parts = name.split('@')
            name = parts[0]
            this.version = parts[1]
        }
        this.name = name
        this.data = {
            id: this.id,
            name: this.name,
            seq: 0,
            items: {}
        } // markers or other item types

        this.node = this.db.get('pkg').get(this.id)

        // keep sequence number up-to-date for package
        this.node.get('seq').on((v, k) => {
            this.seq = v
            // console.log(`${this.logPrefix} sequence update: ${this.seq}`)
        })
    }

    // -------------------------------------------------------------------------
    get logPrefix () {
        return `[p:${this.name || 'new package'}@${this.version}]`.padEnd(20, ' ')
    }

    get id () {
        return this.name + '@' + this.version
    }

    set id (val) {
        if (val) {
            let parts = val.split('@')
            this.name = val[0]
            this.version = val[1]
        }
        this.node = this.db.get('pkg').get(this.id)
    }

    // -------------------------------------------------------------------------
    set seq (val) {
        if (val) {
            this.data.seq = val
        }
    }

    get seq () {
        return this.data.seq
    }

    seqUp () {
        this.node.get('seq').once(v => {
            this.seq = v + 1
        }).put(this.seq)
    }

    // -------------------------------------------------------------------------
    /**
    * Publish a new data package to the network
    *
    * Attempts a non-destructive put in case other peers have also published
    */
    save () {
        return this.db.getOrPut(this.node, this.data)
            .then(saved => {
                if (saved) {
                    this.emit('save')
                    console.log(`${this.logPrefix} saved new packaged: ${this.id}`)
                } else {
                    console.log(`${this.logPrefix} package already exists: ${this.id}`)
                }
                return saved
            })
            .catch((e) => {
                console.error(`${this.logPrefix} failed to save package: ${this.id}`)
            })
    }

    /**
    * Use another node to replace this one
    */
    replace (node) {
        return new Promise((resolve, reject) => {
            this.node.put(node, (ack) => {
                console.log(`${this.logPrefix} package replacement result`, ack)
                resolve()
            })
        })
    }

    /*
    * Unpublish removes a data package from the network
    */
    drop () {
        return new Promise((resolve, reject) => {
            this.node.put(null, (v, k) => {
                this.emit('drop')
                return resolve()
            })
        })
    }

    /*
    * Gets a specific item in the current version of this package
    */
    getOneItem (id) {
        return this.node.get('items').get(id)
    }

    /**
    * Gets a list of all items in the current version of this package
    */
    getAllItems () {
        console.log('get all items')
        return new Promise((resolve, reject) => {
            this.node.get('items').once((v, k) => {
                let itemList = []
                Object.keys(v).forEach((item) => {
                    if (item !== '_') {
                        itemList.push(item)
                    }
                })
                resolve(itemList)
            })
        })
    }
}

},{"event-emitter-es6":3}],25:[function(require,module,exports){
const EventEmitter = require('event-emitter-es6')
require('../../helpers/array')

module.exports = class Query extends EventEmitter {
    constructor (db, pkg) {
        super()
        if (!pkg) {
            return console.error('[Query] requires package to construct')
        }
        this.db = db
        this.package = pkg
        this._restrictedKeys = ["#", "<", "_"]
        this.params = []
    }

    addParam (fieldID, criteria) {
        this.params.push([fieldID, criteria])
    }

    filterOutMetadata (raw) {
        const filtered = Object.keys(raw)
            .filter(key => !this._restrictedKeys.includes(key))
            .reduce((obj, key) => {
                obj[key] = raw[key]
                return obj
            }, {})
        return filtered
    }


    /**
    * Looks at latest data and composes a query string for us
    * sends out a request like pkg@0.0.1::1:1:1551694707084 (packageID::version::seq::count::datetime)
    */
    // ultimate return seq::id^field=val.    e.g. 4::jrv0er5nHLK7iwOSHlr2^g=drt2rzsg
    compose () {
        return new Promise((resolve, reject) => {
            let query = this.package.id + '::'
            let highest = 0
            this.package.node.get('seq').once(seq => {
                query += (seq || 0) + '::'

                this.package.node.get('items').once(data => {
                    if (!data) return

                    let items = this.filterOutMetadata(data)
                    query += `${Object.keys(items).length}`

                    // now append datetime if available
                    // @todo consider using datetime if we can achieve reliable cross-device offline support
                    /*if (data.hasOwnProperty('_') && data['_'].hasOwnProperty('>')) {
                        let items = data['_']['>']
                        Object.keys(items).forEach(itemID => {
                            let datetime = items[itemID]
                            if (datetime > highest) {
                                highest = datetime
                            }
                        })
                        query += highest
                    }*/

                    this.params.forEach(param => {
                        query += '|' + param[0] + '=' + param[1]
                    })

                    resolve(query)
                })
            })
        })
    }
}

},{"../../helpers/array":19,"event-emitter-es6":3}],26:[function(require,module,exports){
const EventEmitter = require('event-emitter-es6')
const shortid = require('shortid')
const SEA = require('sea')

module.exports = class User extends EventEmitter {
    constructor (db, clientStorage) {
        super()

        if (!db || db.constructor.name !== 'Database') {
            return console.error('User requires database to construct')
        }
        if (!clientStorage) {
            return console.error('User requires client-side storage to construct')
        }
        this.db = db
        this.node = this.db.stor.user()
        this.username = null
        this.clientStorage = clientStorage // typically browser localStorage
    }

    get logPrefix () {
        if (this.username) {
            return `[u:${this.username}]`.padEnd(20, ' ')
        } else {
            return `[u:anonymous]`.padEnd(20, ' ')
        }
    }

    /**
    * Generates a unique color to match the username
    */
    get color () {
        var hash = 0
        for (var i = 0; i < this.username.length; i++) {
            hash = this.username.charCodeAt(i) + ((hash << 5) - hash)
        }
        var color = '#'
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF
            color += ('00' + value.toString(16)).substr(-2)
        }
        return color
    }

    // -------------------------------------------------------------------------
    onReady (fn) {
        if (this.username) {
            fn()
        } else {
            this.once('auth', fn)
        }
    }

    // -------------------------------------------------------------------------
    /**
    * Authenticates the user with decentralized database
    */
    authenticate (username, password) {
        return new Promise((resolve, reject) => {
            if (this.username) {
                    console.log(`${this.logPrefix} already signed-in user ${this.username}`)
                    resolve()
                    return
            }

            if (!username || !password) {
                let err = new Error()
                err.name = 'user_auth_skipped'
                err.message = 'missing username or password to authenticate'
                return reject(err)
            }

            setTimeout(() => {

                this.node.auth(username, password, (ack) => {
                    if (ack.err) {
                        console.warn(`${this.logPrefix} invalid auth`, ack.err)
                        let err = new Error()
                        err.name = 'user_auth_failed'
                        err.message = username + '/' + password
                        reject(err)
                    } else {
                        // @todo secure token to make sure server can trust we are signed in
                        db.token = this.username = username
                        console.log(`${this.logPrefix} sign-in complete`)
                        this.emit('auth')
                        resolve()
                    }
                })
                
            }, 100)
        })
    }

    leave () {
        return new Promise((resolve, reject) => {
            if (this.node) {
                this.node.leave()
                if (this.node._.hasOwnProperty('sea')) {
                    reject('user_failed_leave')
                } else {
                    console.log(`${this.logPrefix} sign-out complete`)
                    db.token = this.username = null
                    this.emit('leave')
                    resolve()
                }
            } else {
                console.log(`${this.logPrefix} already signed out`)
                resolve()
            }
        })
    }

    /**
    * Registers and stores user within decentralized database
    */
    create (username, password) {
        return new Promise((resolve, reject) => {
            username = username || shortid.generate()
            password = password || shortid.generate()
            console.log(`${this.logPrefix} create user with username: ${username}`)
            this.node.create(username, password, (ack) => {
                if (ack.err) {
                    console.log(`${this.logPrefix} unable to save`, ack.err)
                    return reject(new Error('user_create_failed'))
                }
                console.log(`${this.logPrefix} saved to browser`)
                let creds = this.clientStorage.setItem('lx-auth', [username, password].join(':'))
                this.emit('created')
                this.authenticate(username, password)
                    .then(resolve)
            })
        })
    }

    authOrCreate (skipCheck) {
        if (skipCheck) {
            console.log(`${this.logPrefix} make new credentials by explicit request`)
            return this.create()
        } else {
            // check browser for known credentials for this user
            let creds = this.clientStorage.getItem('lx-auth')
            if (!creds) {
                return this.create()
            } else {
                try {
                    let u = creds.split(':')[0]
                    let p = creds.split(':')[1]
                    return this.authenticate(u, p)
                        .catch(err => {
                            // this database may not know about our user yet, so create it...
                            // we assume local storage is a better indicator of truth than database peer
                            return this.create(u, p)
                        })
                } catch (e) {
                    this.clearCredentials()
                    return this.create()
                }
            }
        }
    }

    clearCredentials () {
        console.warn(`${this.logPrefix}  removing invalid creds from storage`)
        this.clientStorage.removeItem('lx-auth')
        console.warn(`${this.logPrefix}  waiting for valid sign in or creation...`)
    }

    // -------------------------------------------------------------------------
    encrypt (data) {
        return new Promise((resolve, reject) => {
            SEA.encrypt(data, this.pair, (enc) => {
                SEA.sign(enc, this.pair, (signedData) => {
                    console.log(`${this.logPrefix} encrypted / signed data: ${signedData}`)
                    resolve(signedData)
                })
            })
        })
    }
}

},{"event-emitter-es6":3,"sea":6,"shortid":9}]},{},[18])(18)
});
