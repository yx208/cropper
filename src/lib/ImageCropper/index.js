import {createCropperBox} from "./template.js";
import {defaultOptions} from "./default.js";
import {
    mergeOptions,
    pointsDistance,
    IS_MOBILE_DEVICE,
    HandleMode
} from "./util.js";

const testElement = document.createElement('div');
testElement.style.cssText = 'max-height: 240px; overflow: hidden;';

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
     * @description Canvas 实例
     * @type {CanvasRenderingContext2D}
     * @private
     */
    ctx = null;

    /**
     * @description 触摸位置
     * @private
     */
    touchPosition = {
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
     * @description 手指触摸的数量
     * @type {HandleMode}
     * @private
     */
    handleMode = HandleMode.MOVE;

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
    _bindEvent() {
        this.container.ele.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        this.container.ele.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        this.container.ele.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
        if (!IS_MOBILE_DEVICE) {
            this.container.ele.addEventListener('wheel', this._onMouseWheel.bind(this), { passive: false });
        }
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

        this._bindEvent();
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
        // 宽高默认正方形，且大小为屏幕的 76%
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
    }

    /**
     * @private
     */
    _mount() {
        this.rootElement.append(this.container.ele);
        this.rootElement.append(testElement);
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchStart(event) {

        console.log('start');

        event.preventDefault();
        event.stopPropagation();

        if (event.touches.length > 2) return;

        if (event.touches.length === 1) {
            this.touchPosition.x = event.touches[0].clientX;
            this.touchPosition.y = event.touches[0].clientY;
            this.handleMode = HandleMode.MOVE;
        } else if (event.touches.length === /* 双指 */2) {
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

        console.log('move');

        event.preventDefault();
        event.stopPropagation();

        if (this.handleMode === HandleMode.MOVE) {
            const moveX = this.touchPosition.x - event.touches[0].clientX;
            const moveY = this.touchPosition.y - event.touches[0].clientY;
            this.image.ele.style.transform = `translate3d(${this.image.x - moveX}px, ${this.image.y - moveY}px, 0)`;
        } else if (this.handleMode === HandleMode.ZOOM) {
            const distance = pointsDistance(
                [event.touches[0].clientX, event.touches[0].clientY],
                [event.touches[1].clientX, event.touches[1].clientY]
            );
            this._zoomImage(distance > this.scaleDistance, 0.02);
            this.scaleDistance = distance;
        }
    }

    /**
     * @param {TouchEvent} event
     * @private
     */
    _onTouchEnd(event) {

        console.log('end');

        event.preventDefault();
        event.stopPropagation();

        if (this.handleMode === HandleMode.MOVE) {
            this.image.x = this.image.x - (this.touchPosition.x - event.changedTouches[0].clientX);
            this.image.y = this.image.y - (this.touchPosition.y - event.changedTouches[0].clientY);
            this._correctEdge();
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
    crop() {

        // 得到真实缩放的比例
        const scale = this.image.ele.naturalWidth / this.image.width,
            sx = (this.cropper.x - this.image.x) * scale,
            sy = (this.cropper.y - this.image.y) * scale,
            sw = this.cropper.width * scale,
            sh = this.cropper.height * scale,
            dw = this.cropper.width,
            dh = this.cropper.height;

        if (this.ctx) {
            this.ctx.clearRect(0 ,0, dw, dh);
            this.ctx.drawImage(this.image.ele, sx, sy, sw, sh, 0, 0, dw, dh);
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = dw;
            canvas.height = dh;
            canvas.style.backgroundColor = '#ccc';
            this.ctx = canvas.getContext('2d');
            this.ctx.drawImage(this.image.ele, sx, sy, sw, sh, 0, 0, dw, dh);
            this.rootElement.append(canvas);
        }
    }
}

export default ImageCropper;
