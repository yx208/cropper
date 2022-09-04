<template>
    <div class="pt-16">
        <div
            class="wrapper"
            :style="{
                height: height + 'px',
                width: width + 'px'
            }">
            <div class="cropper" id="cropper"></div>
            <div class="cropper-box" id="cropper-box">
                <div class="cropper-box-line line-t"></div>
                <div class="cropper-box-line line-r"></div>
                <div class="cropper-box-line line-b"></div>
                <div class="cropper-box-line line-l"></div>
                <div class="cropper-box-dot dot-tl"></div>
                <div class="cropper-box-dot dot-tc"></div>
                <div class="cropper-box-dot dot-tr"></div>
                <div class="cropper-box-dot dot-lc"></div>
                <div class="cropper-box-dot dot-rc"></div>
                <div class="cropper-box-dot dot-bl"></div>
                <div class="cropper-box-dot dot-bc"></div>
                <div class="cropper-box-dot dot-br"></div>
            </div>
        </div>
        <div class="pa-16">
            <div style="margin-bottom: 20px">
                <input type="file" accept="image/png;image/jpg" @change="onPickerImage">
            </div>
            <div>
                <button @click="onClip">裁剪图片</button>
            </div>
        </div>
        <canvas id="canvas"></canvas>
    </div>
</template>
<script setup>

import {ref, onMounted} from 'vue';

const props = defineProps({
    width: {
        type: Number,
        default() {
            // 默认页面全部宽度
            return document.body.clientWidth;
        }
    },
    height: {
        type: Number,
        default: 300
    },
    // 是否允许缩放
    scalable: {
        type: Boolean,
        default: true
    }
});

const imageLoaded = ref(false);
let wheeling = false;   // 滚动中

const KEEP_DECIMAL = 4; // 保留的小数位数
const KEEP_DECIMAL_VALUE = 10000; // 保留的小数位数

/** @type {HTMLImageElement} */
let imageElement = null;
/** @type {HTMLDivElement} */
let cropperElement = null;
/** @type {HTMLDivElement} */
let cropperBoxElement = null;

// 图片信息
const imageInfo = {
    naturalWidth: 0,    // 真实图片宽高
    naturalHeight: 0,
    width: 0,           // 当前图片宽高
    height: 0,
    x: 0,               // 图片在容器的位置 px
    y: 0,
    scale: 1,           // 当前缩放值
    aspectRatio: 1,     // 宽高比
};
// 矩形信息
const rectInfo = {
    x: 0,
    y: 0,
    width: 200,
    height: 200
};
// 第一次触摸的位置
const latestTouch = { x: 0, y: 0 };

onMounted(() => {
    initCropper('cropper');
    initCropperBox('cropper-box');
});

function initCropper(id) {
    cropperElement = document.getElementById(id);
}

/**
 * 初始化裁切框
 */
function initCropperBox(id) {

    const cropperBox = document.getElementById(id);

    // 设置裁切框宽高
    cropperBox.style.width = rectInfo.width + 'px';
    cropperBox.style.height = rectInfo.height + 'px';
    // 设置裁切框位置
    const rectX = (props.width - rectInfo.width) / 2;
    const rectY = (props.height - rectInfo.height) / 2;
    cropperBox.style.left = rectX + 'px';
    cropperBox.style.top = rectY + 'px';

    rectInfo.x = rectX;
    rectInfo.y = rectY;

    // 阻止事件冒泡
    cropperBox.ontouchstart = event => event.stopPropagation();
    cropperBox.ontouchmove = event => event.stopPropagation();
    cropperBox.ontouchend = event => event.stopPropagation();

    // 保存实例
    cropperBoxElement = cropperBox;
}

/**
 * 点击选择图片触发
 * 读取选择的图片，加载到 img 标签
 * @param {Event} event
 */
function onPickerImage(event) {

    const file = event.target.files[0];
    if (!file) {
        console.log('没有选择图片');
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (/** @type {ProgressEvent} */event) => {
        /** @type {string} */
        const data = event.target.result;
        if (data) {
            // 创建 image 元素
            const image = new Image();
            image.src = data;
            image.style.cssText = 'width: 100%; height: 100%;';
            image.onload = () => initCropperImage(image);
            imageLoaded.value = true;
        }
    };
}

/**
 * 计算缩放比例
 * @param {number} width - 图片真实宽度
 * @param {number} height - 图片真实高度
 */
function calcScaleRatio(width, height) {
    /*
     *  图片适应策略
     *
     *  容器宽度较大：
     *      -> 计算出图片要缩放多少，才能填满高度，因为容器拥有足够的宽度容纳图片
     *  容器高度较大：
     *      -> 计算出图片要缩放多少，才能填满宽度，因为容器拥有足够的高度度容纳图片
     *  所以这个值就是缩放值
     *
     */

    let scaleFactor;
    if (width === height) {
        scaleFactor = props.width >= props.height ?
            fixedDecimal(height / props.height) :
            fixedDecimal(width / props.width);
    } else if (width > height) {
        /*
           ｜--------------------｜
           ｜                    ｜
           ｜********************｜
           ｜*                  *｜
           ｜*                  *｜
           ｜********************｜
           ｜                    ｜
           ｜--------------------｜
         */
        // 图片的宽度大于高度
        // 当宽度大于高度，所要缩放宽度，以满足图片在容器内显示
        scaleFactor = fixedDecimal(width / props.width);
    } else {
        /*
           ｜---------------------｜
           ｜     ***********     ｜
           ｜     *         *     ｜
           ｜     *         *     ｜
           ｜     *         *     ｜
           ｜     ***********     ｜
           ｜---------------------｜
         */
        // 图片的宽度大于高度
        // 当高度大于宽度，所要缩放高度，以满足图片在容器内显示
        scaleFactor = fixedDecimal(height / props.height);
    }

    return scaleFactor;
}

/***
 * 初始化裁切的图片
 * @param {HTMLImageElement} image
 */
function initCropperImage(image) {

    // 如果之前有元素，需要进行清理
    if (imageElement) {
        imageElement.remove();
        imageElement = null;
    }

    // 移除事件处理函数
    image.onload = null;

    // 保存实例
    imageElement = image;

    // 图片真实宽高
    const { naturalHeight, naturalWidth } = image;
    imageInfo.naturalHeight = image.naturalHeight;
    imageInfo.naturalWidth = image.naturalWidth;
    // 宽高比
    imageInfo.aspectRatio = fixedDecimal(naturalWidth / naturalHeight);

    // 计算缩放比
    const scaleFactor = calcScaleRatio(naturalWidth, naturalHeight);

    // 保存信息
    imageInfo.scale = scaleFactor;
    imageInfo.width = fixedDecimal(naturalWidth / scaleFactor);
    imageInfo.height = fixedDecimal(naturalHeight / scaleFactor);

    // 居中计算
    imageInfo.x = fixedDecimal(props.width - imageInfo.width) / 2;
    imageInfo.y = fixedDecimal(props.height - imageInfo.height) / 2;
    cropperElement.style.cssText = (
        `transform: translate(${imageInfo.x}px, ${imageInfo.y}px);` +
        `width: ${imageInfo.width}px;` +
        `height: ${imageInfo.height}px;`
    );

    // 添加元素到 DOM
    cropperElement.append(image);

    // 监听触摸事件
    cropperElement.parentElement.ontouchstart = onTouchStart;
    cropperElement.parentElement.ontouchmove = onTouchMove;
    cropperElement.parentElement.ontouchend = onTouchEnd;

    console.log(imageInfo);


    if (props.scalable) {
        cropperElement.parentElement.onwheel = onWheel;
    }
}

/**
 * 滚动, 缩放
 * 这个事件针对于 pc 缩放，mobile 缩放需要在 mousemove 中判断手指
 *
 * @param {WheelEvent} event
 */
function onWheel(event) {

    event.stopPropagation();
    event.preventDefault();

    // 节流

    if (wheeling) return;

    wheeling = true;
    setTimeout(() => wheeling = false, 50);

    const zoomIn = event.deltaY > 0;

    if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return;

    // TODO: 处理缩放，有两种方法，一种是根据滚动距离，一种是根据滚动次数

    // 缩小
    if (zoomIn) {

    }
    // 缩小
    else {

    }

}

/**
 * 触摸开始
 * @param {TouchEvent} event
 */
function onTouchStart(event) {

    event.preventDefault();

    const pos = event.touches[0];
    latestTouch.x = pos.pageX;
    latestTouch.y = pos.pageY;
}

/**
 * 触摸的过程中移动手指
 * @param {TouchEvent} event
 */
function onTouchMove(event) {

    event.stopPropagation();
    event.preventDefault();

    // 双手滑动 -> 缩放
    if (event.touches.length === 2) {
        handleTouchScale([
            event.touches[0],
            event.touches[1]
        ]);
    }
    // 单手移动
    else {
        handleMoveImage(event.touches[0])
    }
}

/**
 * 处理移动图片
 * @param {Touch}  touchEvent
 */
function handleMoveImage(touchEvent) {

    const { pageX, pageY } = touchEvent;

    // 前后移动的距离
    const moveX = latestTouch.x - pageX;
    const moveY = latestTouch.y - pageY;

    // 更新图片位置
    const x = imageInfo.x - moveX;
    const y = imageInfo.y - moveY;

    cropperElement.style.transform = `translate(${x}px,${y}px)`;
}

/**
 * 处理缩放图片
 * @param {Touch[]} touches
 */
function handleTouchScale(touches) {

    // TODO: 处理双指滑动

}

/**
 * 处理缩放图片
 * @param {Touch[]} touches
 */
function handleMouseScale(touches) {

    // TODO: 处理滚动滚动

}

/**
 * 触摸结束，抬起手指
 * @param {TouchEvent} event
 */
function onTouchEnd(event) {

    event.preventDefault();

    // 放手点
    const { pageX, pageY } = event.changedTouches[0];
    // 更新最新位置
    imageInfo.x -= latestTouch.x - pageX;
    imageInfo.y -= latestTouch.y - pageY;
}

/**
 * 计算图片，进行裁切
 */
function onClip() {

    if (!imageLoaded.value) {
        console.log('还未加载图片');
        return;
    }

    // 裁切部分
    const imgXSideToBox = rectInfo.x - imageInfo.x; // 框到图片边缘的大小
    const imgYSideToBox = rectInfo.y - imageInfo.y; // 框到图片边缘的大小
    const sx = imgXSideToBox * imageInfo.scale;     // 图片的开始位置
    const sy = imgYSideToBox * imageInfo.scale;     // 图片的开始位置
    const sw = rectInfo.width * imageInfo.scale;    // 要切多宽
    const sh = rectInfo.height * imageInfo.scale;   // 要切多高

    // 绘制部分
    const dx = 0;               // 从画布左上角 0 开始绘制
    const dy = 0;               // 从画布左上角 0 开始绘制
    const dw = rectInfo.width * 2;  // 在画布中绘制成多大
    const dh = rectInfo.height * 2; // 在画布中绘制成多大

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = dw;
    canvas.height = dh;
    ctx.drawImage(imageElement, sx, sy, sw, sh, dx, dy, dw, dh);

}

/**
 * 接收一个数字，把这个数字固定位数，防止过长小数
 * @param {number} value
 * @return {number}
 */
function fixedDecimal(value) {
    return Math.round(value * KEEP_DECIMAL_VALUE) / KEEP_DECIMAL_VALUE;
}

</script>
<style scoped>

.wrapper {
    background-color: #eee;
    font-size: 0;
    width: 100%;
    height: 300px;
    position: relative;
    overflow: hidden;
}

.cropper {
    overflow: hidden;
    position: absolute;
    will-change: transform;
    font-size: 0;
}

.cropper-box {
    cursor: move;
    width: 200px;
    height: 200px;
    position: absolute;
    top: 0;
    left: 0;
    outline: rgba(51, 153, 255, 0.75) solid 1px;
}

/* ========== line ========== */

.cropper-box-line {
    position: absolute;
    opacity: 0.1;
    width: 100%;
    height: 100%;
}

.cropper-box-line.line-l {
    cursor: ew-resize;
    left: -3px;
    top: 0;
    width: 5px;
}
.cropper-box-line.line-r {
    cursor: ew-resize;
    right: -3px;
    top: 0;
    width: 5px;
}
.cropper-box-line.line-b {
    bottom: -3px;
    cursor: ns-resize;
    height: 5px;
    left: 0;
}
.cropper-box-line.line-t {
    cursor: ns-resize;
    height: 5px;
    left: 0;
    top: -3px;
}

/* ========== dot ========== */

.cropper-box-dot {
    position: absolute;
    background-color: #39f;
    opacity: 0.75;
    width: 5px;
    height: 5px;
}

.cropper-box-dot.dot-rc {
    cursor: ew-resize;
    margin-top: -3px;
    right: -3px;
    top: 50%;
}

.cropper-box-dot.dot-tc {
    cursor: ns-resize;
    left: 50%;
    margin-left: -3px;
    top: -3px;
}

.cropper-box-dot.dot-tr {
    cursor: nesw-resize;
    right: -3px;
    top: -3px;
}

.cropper-box-dot.dot-tl {
    cursor: nwse-resize;
    left: -3px;
    top: -3px;
}

.cropper-box-dot.dot-lc {
    cursor: ew-resize;
    left: -3px;
    margin-top: -3px;
    top: 50%;
}

.cropper-box-dot.dot-bl {
    bottom: -3px;
    cursor: nesw-resize;
    left: -3px;
}

.cropper-box-dot.dot-bc {
    cursor: s-resize;
    bottom: -3px;
    left: 50%;
    margin-left: -3px;
}

.cropper-box-dot.dot-br {
    cursor: nwse-resize;
    bottom: -3px;
    right: -3px;
}

</style>
