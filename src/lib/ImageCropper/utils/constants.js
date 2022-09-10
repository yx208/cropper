// 是否为移动设备
export const IS_MOBILE_DEVICE = document.documentElement ? 'ontouchstart' in document.documentElement : false;

// 屏幕宽度
export const SCREEN_WIDTH = document.body.clientWidth;

// 裁切框最小尺寸
export const CROPPER_MIN_SIZE = 10;

// 如果裁切框大于图片，则缩放后的宽度应该为图片的某个大小
export const CROPPER_SCALE = 0.9;
