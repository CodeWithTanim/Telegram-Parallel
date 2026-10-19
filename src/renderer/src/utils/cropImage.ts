export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2D canvas context available')
  }

  // Set final canvas size to 128x128 for optimized memory and storage
  canvas.width = 128
  canvas.height = 128

  const safeWidth = Math.max(1, pixelCrop.width || image.naturalWidth || 128)
  const safeHeight = Math.max(1, pixelCrop.height || image.naturalHeight || 128)
  const safeX = Math.max(0, pixelCrop.x || 0)
  const safeY = Math.max(0, pixelCrop.y || 0)

  ctx.drawImage(image, safeX, safeY, safeWidth, safeHeight, 0, 0, 128, 128)

  return canvas.toDataURL('image/jpeg', 0.9)
}
