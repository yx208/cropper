<script setup>

import ImageCropper from "../lib/ImageCropper/index.js";
import '../lib/ImageCropper/style.css';
// import localImage from '../assets/ia.png';
import localImage from '../assets/uw.png';
// import localImage from '../assets/ag.png';

/** @type {ImageCropper} */
let instance = null;

const image = new Image();
image.src = localImage;
image.onload = () => {
    instance = new ImageCropper({
        src: image,
        root: 'container'
    });
};

function onClip() {
    instance && instance.crop();
}

</script>

<template>
    <div>
        <div id="container"></div>
        <div class="pa-16">
            <div>
                <button @click="onClip">裁剪图片</button>
            </div>
        </div>
    </div>
</template>
