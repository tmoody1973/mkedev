declare module 'pmtiles' {
  export class Protocol {
    tile: (
      params: { url: string },
      callback: (error: Error | null, data?: ArrayBuffer, cacheControl?: string, expires?: string) => void
    ) => { cancel: () => void }
  }
}
