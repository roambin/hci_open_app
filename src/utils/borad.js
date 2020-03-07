export function getIndex(moveRecorder) {
    let px = moveRecorder.x2 - moveRecorder.x1;
    let py = moveRecorder.y1 - moveRecorder.y2;
    if (Math.sqrt(px * px + py * py) < 30) {
        return null;
    }
    let angle = 5 / 8 * Math.PI - Math.atan2(py,px);
    if (angle < 0) {
        angle += 2 * Math.PI
    }
    let index = Math.floor(angle / (Math.PI / 4));
    return index;
}