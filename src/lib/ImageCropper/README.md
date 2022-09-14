
# ImageCropper

随便写写

## Usage

引入文件
```javascript
import ImageCropper from 'ImageCropper/index.js';
import 'ImageCropper/styles/style.css';
```

加载一张图片，等到图片 `onload` 之后，创建实例
```javascript
const image = new Image();
let instance = null;
image.src = '[image-url]';
image.onload = () => {
    instance = new ImageCropper({
        src: image,
        root: 'container'
    });
};
```

调整到合适的大小位置后，进行裁切
```javascript
instance.crop();
```

## Options

| 属性      | 类型     | 释义       |
|---------|--------|----------|
| src     | Image  | 图片标签实例   |
| root    | string | 一个元素的 id |
| width   | number | 指定容器宽度   |
| height  | number | 指定容器高度   |
| quality | number | 图片质量     |
| Cropper | object | 裁切框，见下   |

#### Cropper

| 属性     | 类型     | 释义    |
|--------|--------|-------|
| width  | number | 裁切框宽度 |
| height | number | 裁切框高度 |
