<script setup>

import ImageCropper from "../lib/ImageCropper/index.js";
import '../lib/ImageCropper/styles/style.css';
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
        root: 'container',
        // width: 600,
        // height: 600,
    });
};

async function onClip() {
    const data = await instance.crop();
    const img = document.getElementById('demo-img');
    img.src = data;
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
        <img id="demo-img" width="300" src="" alt="">
    </div>
</template>
