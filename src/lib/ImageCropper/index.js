import {createCropperBox} from "./utils/template.js";
import {defaultOptions} from "./utils/default.js";
import { IS_MOBILE_DEVICE, CROPPER_MIN_SIZE } from "./utils/constants.js";
import { HandleMode, AdjustDirection } from './utils/tools.js';
import {
    mergeOptions,
    pointsDistance
} from "./utils/util.js";

class ImageCropper {

    /**
     * @description 选项
     * @type {ImageCropperOptions}
     * @readonly
     */
    options = null;

    /**
     * @description 挂载的元素
     * @type {HTMLElement}
     * @private
     */
    rootElement = null;

    /**
     * @description 外层容器
     * @type {CropperContainer}
     * @private
     */
    container = {
        ele: null,
        ratio: 1,
        width: 0,
        height: 0
    };

    /**
     * @description 图片实例
     * @type {CropperImage}
     * @private
     */
    image = {
        ele: null,
        ratio: 1,
        width: 0,
        height: 0,
        x: 0,
        y: 0
    };

    /**
     * @description 裁切框
     * @type {CropperRect}
     * @private
     */
    cropper = {
        ele: null,
        width: 0,
        height: 0,
        x: 0,
        y: 0
    };

    /**
     * @description 摁下的位置
     * @type {CropperPosition}
     * @private
     */
    pressPos = {
        x: 0,
        y: 0
    };

    /**
     * @description 缩放距离
     * @type {Number}
     * @private
     */
    scaleDistance = 0;

    /**
     * @description 处理模式
     * @type {HandleMode}
     * @private
     */
    handleMode = HandleMode.NONE;

    /**
     * @description 调整方向
     * @type {AdjustDirection}
     * @private
     */
    adjustDirection = AdjustDirection.NONE;

    /**
     * @param {ImageCropperOptions} options
     */
    constructor(options) {

        this.options = mergeOptions(defaultOptions, options);
        this.rootElement = document.getElementById(this.options.root);

        this._initContainer();
        this._initImage();
        this._initCropper();

        this._mount();
    }

    /**
     * 绑定事件
     * @private
     */
    _bindContainerEvent() {
        if (IS_MOBILE_DEVICE) {
            this.container.ele.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
            this.container.ele.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
            this.container.ele.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
        } else {
            this.container.ele.addEventListener('mousedown', this._onMousedown.bind(this), { passive: false });
            this.container.ele.addEventListener('mousemove', this._onMousemove.bind(this), { passive: false });
            this.container.ele.addEventListener('mouseup', this._onMouseup.bind(this), { passive: false });
            this.container.ele.addEventListener('mouseleave', this._onMouseup.bind(this), { passive: false });
            this.container.ele.addEventListener('wheel', this._onMouseWheel.bind(this), { passive: false });
        }
    }

    /**
     * 绑定事件
     * @private
     */
    _bindCropperBoxEvent() {
        if (IS_MOBILE_DEVICE) {
            [...this.cropper.ele.children].forEach(ele => {
                ele.addEventListener('touchstart', this._onCropperBoxStart.bind(this), { passive: false });
                ele.addEventListener('touchend', this._onCropperBoxEnd.bind(this), { passive: false });
            });
        } else {
            [...this.cropper.ele.children].forEach(ele => {
                ele.addEventListener('mousedown', this._onCropperBoxStart.bind(this), { passive: false });
                ele.addEventListener('mouseup', this._onCropperBoxEnd.bind(this), { passive: false });
            });
        }
    }

    /**
     * @private
     * @param {MouseEvent | TouchEvent} event
     */
    _onCropperBoxStart(event) {

        event.stopPropagation()
        event.preventDefault();

        // if (this.handleMode !== HandleMode.NONE && this.adjustDirection !== AdjustDirection.NONE)
        //     return;

        this.pressPos.x = event.clientX ?? event.touches[0].clientX;
        this.pressPos.y = event.clientY ?? event.touches[0].clientY;

        const dir = event.target.getAttribute('data-dir');
        this.handleMode = HandleMode.ADJUST;
        this.adjustDirection = AdjustDirection[dir];
    }

    /**
     * @private
     * @param {MouseEvent | TouchEvent} event
     */
    _onCropperBoxEnd(event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.handleMode === HandleMode.NONE || this.adjustDirection === AdjustDirection.NONE)
            return;

        switch (this.adjustDirection) {
            case AdjustDirection.EAST: {
                // 可能框的大小超过图片，由于框的限制处理不在这，所以取框最新的宽度即可
                this.cropper.width = parseFloat(this.cropper.ele.style.width);
                break;
            }
            case AdjustDirection.WEST: {
                // 最后设置的宽度 - 最开始的宽度 = 移动的距离
                const move = parseFloat(this.cropper.ele.style.width) - this.cropper.width;
                this.cropper.x -= move;
                this.cropper.width += move;
                break;
            }
            case AdjustDirection.SOUTH: {
                // 可能框的大小超过图片，由于框的限制处理不在这，所以取框最新的宽度即可
                this.cropper.height = parseFloat(this.cropper.ele.style.height);
                break;
            }
            case AdjustDirection.NORTH: {
                // 最后设置的高度 - 最开始的高度 = 移动的距离
                const move = parseFloat(this.cropper.ele.style.height) - this.cropper.height;
                this.cropper.y -= move;
                this.cropper.height += move;
                break;
            }
            case AdjustDirection.SOUTHEAST: {
                this.cropper.width = parseFloat(this.cropper.ele.style.width);
                this.cropper.height = parseFloat(this.cropper.ele.style.height);
                break;
            }
            case AdjustDirection.NORTHEAST: {
                const move = parseFloat(this.cropper.ele.style.height) - this.cropper.height;
                this.cropper.y -= move;
                this.cropper.height += move;
                this.cropper.width = parseFloat(this.cropper.ele.style.width);
                break;
            }
            case AdjustDirection.SOUTHWEST: {
                const move = parseFloat(this.cropper.ele.style.width) - this.cropper.width;
                this.cropper.x -= move;
                this.cropper.width += move;
                this.cropper.height = parseFloat(this.cropper.ele.style.height);
                break;
            }
            case AdjustDirection.NORTHWEST: {
                const moveX = parseFloat(this.cropper.ele.style.width) - this.cropper.width;
                const moveY = parseFloat(this.cropper.ele.style.height) - this.cropper.height;
                this.cropper.x -= moveX;
                this.cropper.y -= moveY;
                this.cropper.width += moveX;
                this.cropper.height += moveY;
            }
        }

        this.adjustDirection = AdjustDirection.NONE;
        this.handleMode = HandleMode.NONE;
    }

    /**
     * @private
     */
    _initContainer() {
        const {width, height} = this.options;
        this.container.width = width;
        this.container.height = height;
        this.container.ratio = width / height;

        this.container.ele = document.createElement('div');
        this.container.ele.className = 'image-cropper-container';
        this.container.ele.style.cssText = `width: ${width}px; height: ${height}px`;

        this._bindContainerEvent();
    }

    /**
     * @private
     */
    _initImage() {

        const targetImage = this.options.src,
            { naturalWidth, naturalHeight } = targetImage,
            imageRatio = naturalWidth / naturalHeight;

        const fillWidth = () => {
            this.image.width = this.container.width;
            this.image.height = this.container.width / imageRatio;
        };
        const fillHeight = () => {
            this.image.width = this.container.height * imageRatio;
            this.image.height = this.container.height;
        };

        if (naturalWidth === naturalHeight) {
            this.container.width >= this.container.height ? fillHeight() : fillWidth();
        } else if (naturalWidth > naturalHeight) {
            fillWidth();
        } else {
            fillHeight();
        }

        this.image.x = (this.container.width - this.image.width) / 2;
        this.image.y = (this.container.height - this.image.height) / 2;
        targetImage.className = 'cropper-image';
        targetImage.style.cssText = `
            width: ${this.image.width}px;
            height: ${this.image.height}px;
            transform: translate(${this.image.x}px, ${this.image.y}px);
        `;

        this.image.ele = targetImage;
        this.image.ratio = imageRatio;
        this.container.ele.append(targetImage);
    }

    /**
     * @private
     */
    _initCropper() {

        this.cropper.width = this.options.cropper.width;
        this.cropper.height = this.options.cropper.height;
        this.cropper.x = (this.container.width - this.cropper.width) / 2;
        this.cropper.y = (this.container.height - this.cropper.height) / 2;

        const ele = createCropperBox();
        ele.style.cssText = `
            width: ${this.cropper.width}px;
            height: ${this.cropper.height}px;
            transform: translate3d(${this.cropper.x}px, ${this.cropper.y}px, 0);
        `;
        this.cropper.ele = ele;
        this.container.ele.append(this.cropper.ele);
        this._bindCropperBoxEvent();
    }

    /**
     * 挂在到容器
     * @private
     */
    _mount() {
        this.rootElement.append(this.container.ele);
    }

    /**
     * 鼠标摁下
     * @param {MouseEvent} event
     * @private
     */
    _onMousedown(event) {

        event.preventDefault();
        event.stopPropagation();

        this.pressPos.x = event.clientX;
        this.pressPos.y = event.clientY;
        this.handleMode = HandleMode.MOVE;
    }

    /**
     * 鼠标摁下移动
     * @param {MouseEvent} event
     * @private
     */
    _onMousemove(event) {

        event.preventDefault();
        event.stopPropagation();

        // 没有东西在处理
        if (this.handleMode === HandleMode.NONE) return;

        // 移动了的距离
        const moveX = this.pressPos.x - event.clientX;
        const moveY = this.pressPos.y - event.clientY;

        if (this.handleMode === HandleMode.MOVE) {
            this.image.ele.style.transform = `translate3d(${this.image.x - moveX}px, ${this.image.y - moveY}px, 0)`;
        } else if (this.handleMode === HandleMode.ADJUST) {
            this._handleCropperAdjust(moveX, moveY);
        }

    }

    /**
     * 鼠标弹起
     * @param {MouseEvent} event
     * @private
     */
    _onMouseup(event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.handleMode === HandleMode.NONE) return;

        const x = this.pressPos.x - event.clientX;
        const y = this.pressPos.y - event.clientY;
        if (this.handleMode === HandleMode.ZOOM || this.handleMode === HandleMode.MOVE) {
            this.image.x = this.image.x - x;
            this.image.y = this.image.y - y;
            this._correctEdge();
        }

        this.handleMode = HandleMode.NONE;
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchStart(event) {

        event.preventDefault();
        event.stopPropagation();

        if (event.touches.length > 2) return;

        if (event.touches.length === 1) {
            this.pressPos.x = event.touches[0].clientX;
            this.pressPos.y = event.touches[0].clientY;
            this.handleMode = HandleMode.MOVE;
        } else if (event.touches.length === 2) {
            this.scaleDistance = pointsDistance(
                [event.touches[0].clientX, event.touches[0].clientY],
                [event.touches[1].clientX, event.touches[1].clientY]
            );
            this.handleMode = HandleMode.ZOOM;
        }
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchMove(event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.handleMode === HandleMode.NONE) return;

        if (this.handleMode === HandleMode.MOVE) {
            const moveX = this.pressPos.x - event.touches[0].clientX;
            const moveY = this.pressPos.y - event.touches[0].clientY;
            this.image.ele.style.transform = `translate3d(${this.image.x - moveX}px, ${this.image.y - moveY}px, 0)`;
        } else if (this.handleMode === HandleMode.ZOOM) {
            const distance = pointsDistance(
                [event.touches[0].clientX, event.touches[0].clientY],
                [event.touches[1].clientX, event.touches[1].clientY]
            );
            this._zoomImage(distance > this.scaleDistance, 0.02);
            this.scaleDistance = distance;
        } else if (this.handleMode === HandleMode.ADJUST) {
            const moveX = this.pressPos.x - event.touches[0].clientX;
            const moveY = this.pressPos.y - event.touches[0].clientY;
            this._handleCropperAdjust(moveX, moveY);
        }
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchEnd(event) {

        event.preventDefault();
        event.stopPropagation();

        if (this.handleMode === HandleMode.MOVE) {
            this.image.x = this.image.x - (this.pressPos.x - event.changedTouches[0].clientX);
            this.image.y = this.image.y - (this.pressPos.y - event.changedTouches[0].clientY);
            this._correctEdge();
        }

        // 手指已经全部挪开
        if (event.targetTouches.length === 0) {
            this.handleMode = HandleMode.NONE;
        }
    }

    /**
     * 调整裁切框大小
     * @param {number} x - 触摸开始点 - 当前移动点的 x 距离，如果向右，则为负数
     * @param {number} y - 触摸开始点 - 当前移动点的 y 距离，如果向下，则为负数
     * @private
     */
    _handleCropperAdjust(x, y) {
        switch (this.adjustDirection) {
            case AdjustDirection.EAST: {
                const value = this.cropper.width - x;
                if (
                    value + this.cropper.x <= this.image.x + this.image.width &&
                    value >= CROPPER_MIN_SIZE
                ) {
                    this.cropper.ele.style.width = value + 'px';
                }
                break;
            }
            case AdjustDirection.WEST: {
                if (this.cropper.x - x >= this.image.x && this.cropper.width + x >= CROPPER_MIN_SIZE) {
                    this.cropper.ele.style.cssText = `
                        width: ${this.cropper.width + x}px; height: ${this.cropper.height}px;
                        transform: translate3d(${this.cropper.x - x}px, ${this.cropper.y}px, 0);
                    `;
                }
                break;
            }
            case AdjustDirection.SOUTH: {
                const value = this.cropper.height - y;
                if (
                    value + this.cropper.y <= this.image.height + this.image.y &&
                    value >= CROPPER_MIN_SIZE
                ) {
                    this.cropper.ele.style.height = value + 'px';
                }
                break;
            }
            case AdjustDirection.NORTH: {
                if (this.cropper.y - y >= this.image.y && this.cropper.height + y >= CROPPER_MIN_SIZE) {
                    this.cropper.ele.style.cssText = `
                        width: ${this.cropper.width}px; height: ${this.cropper.height + y}px;
                        transform: translate3d(${this.cropper.x}px, ${this.cropper.y - y}px, 0);
                    `;
                }
                break;
            }
            case AdjustDirection.SOUTHEAST: {
                const adjustWidth = this.cropper.width - x;
                const adjustHeight = this.cropper.height - y;
                if (
                    adjustWidth >= CROPPER_MIN_SIZE &&
                    adjustHeight >= CROPPER_MIN_SIZE &&
                    adjustWidth + this.cropper.x <= this.image.x + this.image.width &&
                    adjustHeight + this.cropper.y <= this.image.height + this.image.y
                ) {
                    this.cropper.ele.style.width = adjustWidth + 'px';
                    this.cropper.ele.style.height = adjustHeight + 'px';
                }
                break;
            }
            case AdjustDirection.NORTHEAST: {
                // 位置上取巧
                if (this.cropper.y - y >= this.image.y && this.cropper.height + y >= CROPPER_MIN_SIZE) {
                    this.cropper.ele.style.cssText = `
                        width: ${this.cropper.width}px; height: ${this.cropper.height + y}px;
                        transform: translate3d(${this.cropper.x}px, ${this.cropper.y - y}px, 0);
                    `;
                }
                const adjustWidth = this.cropper.width - x;
                if (
                    adjustWidth >= CROPPER_MIN_SIZE &&
                    adjustWidth + this.cropper.x <= this.image.x + this.image.width
                ) {
                    this.cropper.ele.style.width = adjustWidth + 'px';
                }

                break;
            }
            case AdjustDirection.SOUTHWEST: {
                if (this.cropper.x - x >= this.image.x && this.cropper.width + x >= CROPPER_MIN_SIZE) {
                    this.cropper.ele.style.cssText = `
                        width: ${this.cropper.width + x}px; height: ${this.cropper.height}px;
                        transform: translate3d(${this.cropper.x - x}px, ${this.cropper.y}px, 0);
                    `;
                }
                const value = this.cropper.height - y;
                if (
                    value >= CROPPER_MIN_SIZE &&
                    value + this.cropper.y <= this.image.height + this.image.y
                ) {
                    this.cropper.ele.style.height = value + 'px';
                }

                break;
            }
            case AdjustDirection.NORTHWEST: {

                let {
                    x: _x,
                    y: _y,
                    width: _width,
                    height: _height
                } = this.cropper;

                if (this.cropper.x - x >= this.image.x && _width + x >= CROPPER_MIN_SIZE) {
                    _x -= x;
                    _width += x;
                } else {
                    // 当前 cropper 元素宽度 - cropper 对象保存的宽度 = 已经移动了的长度，高度与此相同
                    const moveX = parseFloat(this.cropper.ele.style.width) - this.cropper.width;
                    _width += moveX;
                    _x -= moveX;
                }

                if (this.cropper.y - y >= this.image.y && _height + y >= CROPPER_MIN_SIZE) {
                    _y -= y;
                    _height += y;
                } else {
                    const moveY = parseFloat(this.cropper.ele.style.height) - this.cropper.height;
                    _height += moveY;
                    _y -= moveY;
                }

                this.cropper.ele.style.cssText = `
                    width: ${_width}px; height: ${_height}px;
                    transform: translate3d(${_x}px, ${_y}px, 0);
                `;

                break;
            }
        }
    }

    /**
     * @param {WheelEvent} event
     * @private
     */
    _onMouseWheel(event) {

        event.preventDefault();
        event.stopPropagation();

        if (event.deltaY > 0) {
            this._zoomImage(false);
        } else {
            this._zoomImage(true);
        }
    }

    /**
     * 缩放
     * @param {Boolean} zoomIn - 是否放大
     * @param {Number} scaleFactor - 缩放因子，取值 0 ~ 1
     * @private
     */
    _zoomImage(zoomIn, scaleFactor = 0.1) {

        const widthScale = this.image.width * scaleFactor;
        const heightScale = this.image.height * scaleFactor;

        if (zoomIn) {
            this.image.width += widthScale;
            this.image.height += heightScale;
            this.image.x -= widthScale / 2;
            this.image.y -= heightScale / 2;
        } else {
            const width = this.image.width - widthScale,
                height = this.image.height - heightScale,
                x = this.image.x + widthScale / 2,
                y = this.image.y + heightScale / 2;

            // 小于裁切框
            if (
                x > this.cropper.x ||
                y > this.cropper.y ||
                (x + width) < (this.cropper.x + this.cropper.width) ||
                (y + height) < (this.cropper.y + this.cropper.height)
            ) {
                return;
            }

            this.image.width = width;
            this.image.height = height;
            this.image.x = x;
            this.image.y = y;
        }

        this.image.ele.style.cssText = `
            width: ${this.image.width}px;
            height: ${this.image.height}px;
            transform: translate3d(${this.image.x}px, ${this.image.y}px, 0);
        `;
    }

    /**
     * 矫正边缘
     * @private
     */
    _correctEdge() {

        let isChange = false;

        // x 溢出
        if (this.cropper.x < this.image.x) {
            this.image.x = this.cropper.x;
            isChange = true;
        } else if (this.cropper.x + this.cropper.width > this.image.x + this.image.width) {
            this.image.x = this.cropper.x + this.cropper.width - this.image.width;
            isChange = true;
        }

        // y 溢出
        if (this.cropper.y < this.image.y) {
            this.image.y = this.cropper.y;
            isChange = true;
        } else if (this.cropper.y + this.cropper.height > this.image.y + this.image.height) {
            this.image.y = this.cropper.y + this.cropper.height - this.image.height;
            isChange = true;
        }

        if (isChange) {
            this.image.ele.style.transform = `translate3d(${this.image.x}px, ${this.image.y}px, 0)`;
        }
    }

    /**
     * 进行裁切
     * @public
     */
    async crop() {

        // 得到真实缩放的比例
        const scale = this.image.ele.naturalWidth / this.image.width,
            sx = (this.cropper.x - this.image.x) * scale,
            sy = (this.cropper.y - this.image.y) * scale,
            sw = this.cropper.width * scale,
            sh = this.cropper.height * scale,
            dw = this.cropper.width,
            dh = this.cropper.height;

        const canvas = document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.image.ele, sx, sy, sw, sh, 0, 0, dw, dh);

        if (this.options.quality < 1) {
            return canvas.toDataURL('image/jpeg', this.options.quality);
        } else {
            return canvas.toDataURL('image/png');
        }
    }
}

export default ImageCropper;
