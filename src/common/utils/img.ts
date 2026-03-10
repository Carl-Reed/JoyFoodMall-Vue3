// 接收一个 Blob 对象，返回一个可用的图片 URL
export function loadImgBlob(blob: Blob){
  return URL.createObjectURL(blob);
}
