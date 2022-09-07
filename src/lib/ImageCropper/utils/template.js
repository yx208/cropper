
const CROPPER_BOX_TPL = (
    '<div class="cropper-box-line line-north" data-dir="NORTH"></div>' +
    '<div class="cropper-box-line line-east" data-dir="EAST"></div>' +
    '<div class="cropper-box-line line-south" data-dir="SOUTH"></div>' +
    '<div class="cropper-box-line line-west" data-dir="WEST"></div>' +
    '<div class="cropper-box-dot dot-northwest" data-dir="NORTHWEST"></div>' +
    '<div class="cropper-box-dot dot-north" data-dir="NORTH"></div>' +
    '<div class="cropper-box-dot dot-northeast" data-dir="NORTHEAST"></div>' +
    '<div class="cropper-box-dot dot-west" data-dir="WEST"></div>' +
    '<div class="cropper-box-dot dot-east" data-dir="EAST"></div>' +
    '<div class="cropper-box-dot dot-southwest" data-dir="SOUTHWEST"></div>' +
    '<div class="cropper-box-dot dot-south" data-dir="SOUTH"></div>' +
    '<div class="cropper-box-dot dot-southeast" data-dir="SOUTHEAST"></div>'
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
