import { TypedEmitter } from 'tiny-typed-emitter'
import RandomAccessStorage from 'random-access-storage'
import { type Duplex, type Readable } from 'streamx'
import { type Duplex as NodeDuplex } from 'stream'
import type Protomux from 'protomux'
import type NoiseStream from '@hyperswarm/secret-stream'

interface RemoteBitfield {
  get(index: number): boolean
}

interface CompactEncodingState {
  start: number
  end: number
  buffer: Buffer | Uint8Array
  cache: any
}

interface CompactEncoding<T> {
  preencode(state: CompactEncodingState, val: T): void
  encode(state: CompactEncodingState, val: T): void
  decode(state: CompactEncodingState): T
}

interface CodecEncoding<T> {
  encode(val: T): Buffer | Uint8Array
  decode(buf: Buffer | Uint8Array): T
}

type Encoding<T> = CompactEncoding<T> | CodecEncoding<T>

interface HypercoreExtension<T> {
  name: string
  encoding: Encoding<T>
  send(message: T, peer: any): void
  broadcast(message: T): void
  destroy(): void
}

interface PeerOnRangeOptions {
  drop?: boolean
  start: number
  length: number
}

interface HypercorePeer {
  remotePublicKey: Buffer
  remoteBitfield: RemoteBitfield
  onrange(options: PeerOnRangeOptions): void
}

interface DownloadingRange {
  destroy(): void
  done(): Promise<void>
}

type HypercoreStorageName = 'oplog' | 'tree' | 'bitfield' | 'data'

interface HypercoreInfo {
  key: Buffer
  discoveryKey: Buffer
  length: number
  contiguousLength: number
  byteLength: number
  fork: number
  padding: number
  storage: {
    oplog: number
    tree: number
    blocks: number
    bitfield: number
  }
}

interface KeyPair {
  publicKey: Buffer
  secretKey: Buffer
}

declare namespace Hypercore {
  interface HypercoreEvents {
    'peer-add'(peer: any): void
    'peer-remove'(peer: any): void
    download(index: number, byteLength: number, from: any): void
    ready(): void
    close(allClosed: boolean): void
    upload(index: number, byteLength: number, to: any): void
    truncate(index: number, fork: number): void
    append(): void
  }

  type ValueEncoding = 'json' | 'utf-8' | 'binary'

  interface HypercoreOptions<
    TValueEncoding extends Hypercore.ValueEncoding = 'binary',
    TKey extends Buffer | string | undefined = undefined
  > {
    createIfMissing?: boolean // create a new Hypercore key pair if none was present in storage
    overwrite?: boolean // overwrite any old Hypercore that might already exist
    valueEncoding?: TValueEncoding // defaults to binary
    encodeBatch?(batch: any[]): void // optionally apply an encoding to complete batches
    key: TKey
    keyPair?: KeyPair // optionally pass the public key and secret key as a key pair
    encryptionKey?: Buffer // optionally pass an encryption key to enable block encryption
    onwait?: () => {} // hook that is called if gets are waiting for download
    timeout?: number // wait at max some milliseconds (0 means no timeout)
    writable?: boolean // disable appends and truncates
    preload?: () => PromiseLike<Partial<HypercoreOptions<TValueEncoding, TKey>>>
  }

  interface HypercoreGetOptions<
    TValueEncoding extends Hypercore.ValueEncoding = 'binary'
  > {
    wait?: boolean // wait for block to be downloaded
    onwait?(): void // hook that is called if the get is waiting for download
    timeout?: number // wait at max some milliseconds (0 means no timeout)
    valueEncoding?: TValueEncoding // defaults to the core's valueEncoding
    decrypt?: boolean // automatically decrypts the block if encrypted
  }

  type HypercoreStorage =
    | string
    | ((name: HypercoreStorageName) => RandomAccessStorage)
}


type ProtocolStream = Omit<NoiseStream, 'userData'> & { userData: Protomux }
type ReplicationStream = Duplex & { noiseStream: ProtocolStream }

type CreateProtocolStreamOpts = {
  stream?: Duplex | NodeDuplex
  keepAlive?: boolean
  ondiscoverykey?: (id: Buffer) => Promise<any>
}

declare class Bitfield {
  get(index: number): boolean
  want(start: number, length: number): IterableIterator<{
    start: number;
    bitfield: Uint32Array
  }>
}

declare class Core {
  bitfield: Bitfield
}

declare class Hypercore<
  TValueEncoding extends Hypercore.ValueEncoding = 'binary',
  TKey extends Buffer | string | undefined = undefined
> extends TypedEmitter<Hypercore.HypercoreEvents> {
  readonly writable: boolean
  readonly readable: boolean
  readonly closed: boolean
  readonly id: null | string
  readonly key: TKey extends undefined ? null | Buffer : Buffer
  readonly peers: any[]
  readonly sessions: unknown[]
  readonly keyPair: null | KeyPair
  readonly discoveryKey: null | Buffer
  readonly encryptionKey: null | Buffer
  readonly length: number
  readonly contiguousLength: number
  readonly fork: number
  readonly padding: number
  readonly core: null | Core
  static createProtocolStream(stream: boolean | Duplex | NodeDuplex | NoiseStream | ProtocolStream | ReplicationStream | Protomux, opts?: CreateProtocolStreamOpts): ReplicationStream

  constructor(storage: Hypercore.HypercoreStorage)
  constructor(
    storage: Hypercore.HypercoreStorage,
    key: TKey,
    options?: Hypercore.HypercoreOptions<TValueEncoding, TKey>
  )
  constructor(
    storage: Hypercore.HypercoreStorage,
    options?: Hypercore.HypercoreOptions<TValueEncoding, TKey>
  )

  /** Append a block of data (or an array of blocks) to the core. Returns the
   * new length and byte length of the core. */
  append(block: any): Promise<{ length: number; byteLength: number }>
  /** Get a block of data. If the data is not available locally this method will
   * prioritize and wait for the data to be downloaded. */
  get<TGetValueEncoding extends Hypercore.ValueEncoding = TValueEncoding>(
    index: number,
    options?: Hypercore.HypercoreGetOptions<TGetValueEncoding>
  ): Promise<
    | null
    | (TGetValueEncoding extends 'binary'
        ? Buffer
        : TGetValueEncoding extends 'utf-8'
        ? string
        : TGetValueEncoding extends 'json'
        ? any
        : unknown)
  >
  /** Check if the core has all blocks between start and end. */
  has(index: number): boolean
  has(start: number, end: number): boolean
  update(opts?: { wait?: boolean }): Promise<void>
  seek(
    byteOffset: number,
    options?: {
      wait: true // wait for data to be downloaded
      timeout: 0 // wait at max some milliseconds (0 means no timeout)
    }
  ): Promise<[index: number, relativeOffset: number]>
  createReadStream(options?: {
    start: number
    end: number
    live: boolean
    snapshot: boolean // auto set end to core.length on open or update it on every read
  }): Readable
  createByteStream(options?: {
    byteOffset: number
    byteLength: number
    prefetch: number
  }): Readable
  clear(
    start: number,
    end?: number,
    opts?: { diff?: boolean }
  ): Promise<{ blocks: number } | null>
  clear(
    start: number,
    opts?: { diff?: boolean }
  ): Promise<{ blocks: number } | null>
  truncate(newLength: number, forkId?: number): Promise<void>
  purge(): Promise<void>
  treeHash(length?: number): Promise<Buffer>
  info(opts?: { storage?: false }): Promise<Omit<HypercoreInfo, 'storage'>>
  info(opts: { storage: true }): Promise<HypercoreInfo>
  download(range?: {
    start?: number
    end?: number
    blocks?: number[]
    linear?: boolean
    ifAvailable?: boolean
  }): DownloadingRange
  session(options?: Hypercore.HypercoreOptions<TValueEncoding>): Hypercore
  close(): Promise<void>
  ready(): Promise<void>
  registerExtension<T = Buffer | Uint8Array>(
    name: string,
    handlers?: {
      encoding?: Encoding<T>
      onmessage?: (message: T, peer: any) => void
    }
  ): HypercoreExtension<T>
  replicate(
    isInitiatorOrReplicationStream: boolean | Duplex | NodeDuplex,
    opts?: { keepAlive?: boolean }
  ): ReplicationStream
  replicate(protomux: Protomux, opts?: { keepAlive?: boolean }): Protomux
  findingPeers(): () => void
}

export = Hypercore
