import { SCREEN_WIDTH } from "./util.js";

const defaultOptions = {

    // 容器宽度
    width: SCREEN_WIDTH,
    // 容器高度
    height: SCREEN_WIDTH,

    // 裁切框默认宽高
    cropper: {
        width: SCREEN_WIDTH * 0.4,
        height: SCREEN_WIDTH * 0.4
    }
};

export {
    defaultOptions
}
