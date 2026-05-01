// src/services/shareService.ts

// 独立的分享服务，封装不同平台的分享逻辑
export const shareService = {
  // 检查是否有图片可分享
  canShare: (imageUri: string | null): boolean => {
    return !!imageUri;
  },
};
