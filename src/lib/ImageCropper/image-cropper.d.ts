
declare interface ImageCropperOptions {
    width?: number
    height?: number
    src: HTMLImageElement
    root: string
    quality?: number
    cropper?: {
        width: number
        height: number
    }
}

declare interface CropperContainer {
    ele: HTMLElement
    ratio: number
    width: number
    height: number
}

declare interface CropperRect {
    ele: HTMLElement
    width: number
    height: number
    x: number
    y: number
}

declare interface CropperImage {
    ele: HTMLImageElement
    ratio: number
    width: number
    height: number
    x: number
    y: number
}

declare interface CropperPosition {
    x: number
    y: number
}
