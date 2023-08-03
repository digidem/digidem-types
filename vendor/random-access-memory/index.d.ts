import RandomAccessStorage from 'random-access-storage'

declare namespace RandomAccessMemory {
  interface RAMOptions {
    length?: number
    pageSize?: number
    buffer?: Buffer
  }
}

declare class RandomAccessMemory extends RandomAccessStorage {
  constructor(options?: RandomAccessMemory.RAMOptions)
  toBuffer(): Buffer
  clone(): RandomAccessMemory
  static reusable(): (name: string) => RandomAccessMemory
}

export = RandomAccessMemory
