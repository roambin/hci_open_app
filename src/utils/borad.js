export function getIndex(moveRecorder) {
    let px = moveRecorder.x2 - moveRecorder.x1;
    let py = moveRecorder.y1 - moveRecorder.y2;
    // 移动的范围太小，返回null？
    if (Math.sqrt(px * px + py * py) < 30) {
        return null;
    }
    // 公式：从canvas正上方开始是0号index表示的app，顺时针旋转，其余的index分别为1、2、3、4、5、6、7。
    // 0号App的范围为3/8*pi到5/8*pi之间。因此用5/8*pi减去角度，换算为“当前点距离0号在第二象限的边界的角度”
    // 考虑到求转换后的最终角度时，如果处于第二象限的5/8*pi至pi之间，有可能出现负值现象。对负值+一周的弧度进行处理即可。
    // 由于一个app占用的角度为pi/4，故最后再用最终的角度除以pi/4
    let angle = 5 / 8 * Math.PI - Math.atan2(py,px);
    if (angle < 0) {
        angle += 2 * Math.PI
    }
    let index = Math.floor(angle / (Math.PI / 4));
    return index;
}