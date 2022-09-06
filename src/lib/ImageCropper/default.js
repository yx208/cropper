import { SCREEN_WIDTH } from "./constants.js";

const defaultOptions = {

    // The width of the container
    width: SCREEN_WIDTH,
    // The height of the container
    height: SCREEN_WIDTH,

    // Cropper rectangle size
    cropper: {
        width: SCREEN_WIDTH * 0.4,
        height: SCREEN_WIDTH * 0.4
    },

    // The quality of the output image, the value 0..=1
    quality: 1,

    // Defaults to base64, may add a 'blob' in the future
    output: 'base64',
};

export {
    defaultOptions
}
