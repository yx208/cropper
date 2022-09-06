/**
 * 计算两点距离
 */
function pointsDistance([x1, y1], [x2, y2]) {
    return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function deepClone(value) {
    const type = Object.prototype.toString.call(value).slice(8, -1);
    switch (type) {
        case 'Array': {
            return value.map(i => deepClone(i));
        }
        case 'Object': {
            return Object.keys(value).reduce((result, key) => {
                result[key] = deepClone(value[key]);
                return result;
            }, {});
        }
        default: return value;
    }
}

// 获取一个值的真实类型
const naturalType = value => Object.prototype.toString.call(value).slice(8, -1);

/**
 * 合并裁切选项
 *
 * @param {ImageCropperOptions} left
 * @param {ImageCropperOptions} right
 * @returns {ImageCropperOptions}
 */
function mergeOptions(left, right) {
    return Object.keys(right).reduce((result, k) => {
        if (k in result) {
            result[k] = (naturalType(right[k]) === 'Object' && naturalType(result[k]) === 'Object')
                ? mergeOptions(result[k], right[k])
                : right[k];
        } else {
            result[k] = right[k];
        }
        return result;
    }, { ...left });
}

export {
    pointsDistance,
    deepClone,
    mergeOptions
}
