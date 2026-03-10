export interface FileRecordList {
  total: number,
  rows: Array<{
    id: number, filePath: string, fileType: string, isUsed: number,
    createTime: string, updateTime: string, createBy: string, updateBy: string
  }>
}
