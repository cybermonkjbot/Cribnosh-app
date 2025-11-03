export function createTestFile(content: string | BlobPart[], name: string, type = 'text/plain'): File {
  const blobParts = Array.isArray(content) ? content : [content]
  return new File(blobParts, name, { type })
}

export function createTestImage(name = 'test.jpg', width = 10, height = 10): File {
  // Create a small dummy image (PNG header + arbitrary bytes)
  const header = new Uint8Array([137,80,78,71,13,10,26,10])
  const body = new Uint8Array(width * height * 3).fill(255)
  const blob = new Blob([header, body], { type: 'image/jpeg' })
  return new File([blob], name, { type: 'image/jpeg' })
}