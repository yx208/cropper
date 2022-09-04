
const CROPPER_BOX_TPL = (
    '<div class="cropper-box-line line-t"></div>' +
    '<div class="cropper-box-line line-r"></div>' +
    '<div class="cropper-box-line line-b"></div>' +
    '<div class="cropper-box-line line-l"></div>' +
    '<div class="cropper-box-dot dot-tl"></div>' +
    '<div class="cropper-box-dot dot-tc"></div>' +
    '<div class="cropper-box-dot dot-tr"></div>' +
    '<div class="cropper-box-dot dot-lc"></div>' +
    '<div class="cropper-box-dot dot-rc"></div>' +
    '<div class="cropper-box-dot dot-bl"></div>' +
    '<div class="cropper-box-dot dot-bc"></div>' +
    '<div class="cropper-box-dot dot-br"></div>'
);

/**
 * @return {HTMLDivElement}
 */
function createCropperBox() {
    const div = document.createElement('div');
    div.innerHTML = CROPPER_BOX_TPL;
    div.className = 'cropper-box';
    return div;
}

export {
    createCropperBox
}
