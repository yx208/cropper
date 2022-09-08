// 是否为移动设备
export const IS_MOBILE_DEVICE = document.documentElement ? 'ontouchstart' in document.documentElement : false;

// 屏幕宽度
export const SCREEN_WIDTH = document.body.clientWidth;

// 裁切框最小尺寸
export const CROPPER_MIN_SIZE = 10;
