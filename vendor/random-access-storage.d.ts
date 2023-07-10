import { TypedEmitter } from 'tiny-typed-emitter'

interface Events {
  /** emitted when the storage is fully open */
  open(): void
  /** emitted when the storage is fully closed */
  close(): void
  /** emitted when the storage is fully unlinked */
  unlink(): void
  /** emitted when the storage is fully suspended */
  suspend(): void
  /** emitted when the storage comes out of suspension */
  unsuspend(): void
}

interface Callback<T = void> {
  (err: Error | null, value: T): void
}

declare namespace RandomAccessStorage {
  interface RASOptions {
    /** always create storage on first open */
    createAlways?: boolean
    /** sets ._open */
    open?: typeof RandomAccessStorage.prototype.open
    /** sets ._read */
    read?: typeof RandomAccessStorage.prototype.read
    /** sets ._write */
    write?: typeof RandomAccessStorage.prototype.write
    /** sets ._del */
    del?: typeof RandomAccessStorage.prototype.del
    /** sets ._truncate */
    truncate?: typeof RandomAccessStorage.prototype.truncate
    /** sets ._stat */
    stat?: typeof RandomAccessStorage.prototype.stat
    /** sets ._suspend */
    suspend?: typeof RandomAccessStorage.prototype.suspend
    /** sets ._close */
    close?: typeof RandomAccessStorage.prototype.close
    /** sets ._unlink */
    unlink?: typeof RandomAccessStorage.prototype.unlink
  }
}

declare class RandomAccessStorage<
  TStatObject extends {} = { size: number }
> extends TypedEmitter<Events> {
  /** True if the storage implements ._read. */
  readable: boolean
  /** True if the storage implements ._read. */
  writable: boolean
  /** True if the storage implements ._read. */
  deletable: boolean
  /** True if the storage implements ._read. */
  truncatable: boolean
  /** True if the storage implements ._read. */
  statable: boolean
  /** True if the storage has been fully opened. */
  opened: boolean
  /** True if the storage has been fully close. */
  closed: boolean
  /** True if the storage has been fully unlinked. */
  unlinked: boolean
  /** True if the storage is currently being written to. */
  writing: boolean

  constructor(options?: RandomAccessStorage.RASOptions)

  /**
   * Explicitly open the storage. If you do not call this yourself, it will
   * automatically called before any read/write/del/stat operation.
   *
   * It is safe to call this more than once.
   *
   * Triggers one call to _open if you implement that.
   */
  open(callback: Callback): void

  /**
   * Implement storage open.
   *
   * req.create is true if the storage should be created.
   * Call req.callback when it is fully opened.
   *
   * @param req
   */
  _open(req: { create: boolean; callback: Callback }): void

  /**
   * Read the specified bytes from the storage at the specified byte offset.
   * Calls the callback with a (err, buffer).
   */
  read(offset: number, size: number, callback: Callback<Buffer>): void

  /**
   * Implement storage read.
   *
   * Note that this is guaranteed to run after the storage has been opened and
   * not after it has been closed.
   *
   * @param req.offset the byte offset you should read at.
   * @param req.size the amount of bytes you should read.
   * @param req.callback when the read is completed.
   */
  _read(req: { offset: number; size: number; callback: Callback<Buffer> }): void

  /**
   * Write the specified buffer to the specified byte offset. Optionally pass a
   * callback that is called with (err) when the write has completed.
   */
  write(offset: number, buffer: Buffer, callback?: Callback): void

  /**
   * Implement storage write.
   *
   * Note that this is guaranteed to run after the storage has been opened and
   * not after it has been closed.
   *
   * @param req.offset the byte offset you should write at.
   * @param req.data the buffer you should write.
   * @param req.callback call when write is compelted
   */
  _write(req: { offset: number; data: Buffer; callback: Callback }): void

  /**
   * Delete the specified amount of bytes at the specified offset. Optionally
   * pass a callback that is called with (err) when the delete has completed.
   */
  del(offset: number, size: number, callback?: Callback): void

  /**
   * Implement storage delete.
   *
   * Note that this is guaranteed to run after the storage has been opened and
   * not after it has been closed.
   *
   * @param req.offset the byte offset you should delete at.
   * @param req.size the amount of bytes you should delete.
   * @param req.callback when the delete is completed.
   */
  _del(req: { offset: number; size: number; callback: Callback }): void

  /**
   * Truncate the storage at the specified offset. Optionally pass a callback
   * that is called with (err) when the truncate has completed.
   */
  truncate(offset: number, callback?: Callback): void

  /**
   * Implement storage truncate. Defaults to storage._del(req).
   *
   * Note that this is guaranteed to run after the storage has been opened and
   * not after it has been closed.
   *
   * @param req.offset the byte offset to truncate at.
   */
  _truncate(req: { offset: number }): void

  /**
   * Stat the storage. Should return an object with useful information about the
   * underlying storage
   */
  stat(callback: Callback<TStatObject>): void

  /**
   * Implement storage stat.
   *
   * Call req.callback(err, statObject) when the stat has completed.
   *
   * Note that this is guaranteed to run after the storage has been opened and
   * not after it has been closed.
   *
   */
  _stat(req: { callback: Callback<TStatObject> }): void

  /**
   * Suspend (temporarily close) the storage instance.
   */
  suspend(callback?: Callback): void

  /**
   * Implement storage suspend. Defaults to calling _close.
   *
   * Optionally implement this to add a way for your storage instance to
   * temporarily free resources.
   *
   * Call req.callback(err) when the storage has been fully suspended.
   *
   */
  _suspend(req: { callback: Callback }): void

  /**
   * Close the storage instance.
   */
  close(callback?: Callback): void

  /**
   * Implement storage close
   *
   * Call req.callback(err) when the storage is fully closed.
   *
   * Note this is guaranteed to run after all pending read/write/stat/del
   * operations has finished and no methods will run after.
   *
   */
  _close(req: { callback: Callback }): void

  /**
   * Unlink the storage instance, removing all underlying data.
   */
  unlink(callback?: Callback): void

  /**
   * Implement storage unlink.
   *
   * Call req.callback(err) when the storage has been fully unlinked.
   *
   * Note this is guaranteed to run after .close() has been called and no
   * methods will be run after.
   */
  _unlink(req: { callback: Callback }): void
}

export = RandomAccessStorage
