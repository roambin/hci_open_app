export function getScheme(hashSchemeMap, hash) {
    let matchScheme = null;
    let matchHashSimilarity = 0;
    for (const k in hashSchemeMap) {
        let count = 0;
        for (let i = 0; i < hash.length; i++) {
            if (hash.charAt(i) === hashSchemeMap[k].charAt(i)) {
                count++;
            }
        }
        if (count > matchHashSimilarity) {
            matchHashSimilarity = count;
            matchScheme = k;
        }
    }
    return matchScheme;
}


export function getHash(canvas, ctx) {
    const imgData = cutWhite(canvas, ctx);
    const aHashValue = aHash(imgData);
    console.log('aHash: ' + aHashValue);
    return aHashValue;
}

export function cutWhite(canvas, ctx) {
    const imgDataData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lOffset = canvas.width, rOffset = 0, tOffset = canvas.height, bOffset = 0;
    for (let i = 0; i < canvas.width; i++) {
        for (let j = 0; j < canvas.height; j++) {
            const pos = (i + canvas.width * j) * 4;
            if (imgDataData[pos] !== 255 || imgDataData[pos + 1] !== 255 || imgDataData[pos + 2] !== 255) {
                bOffset = Math.max(j, bOffset);
                rOffset = Math.max(i, rOffset);
                tOffset = Math.min(j, tOffset);
                lOffset = Math.min(i, lOffset);
            }
        }
    }
    // console.log(lOffset, rOffset, tOffset, bOffset);
    return ctx.getImageData(lOffset, tOffset, rOffset - lOffset + 1, bOffset - tOffset + 1);
}

export function aHash(imgData, width = 32, height = 32) {
    //init
    const splitNum = Math.ceil(Math.max(imgData.width / width, imgData.height / height));
    const imgDataData = imgData.data;
    const avgArray = new Array(height);
    for (let i = 0; i < avgArray.length; i++) {
        const e = new Array(width);
        for (let j = 0; j < e.length; j++) {
            e[j] = 0;
        }
        avgArray[i] = e;
    }
    //compress and get average gray
    const fillWidth = splitNum * width;
    const fillHeight = splitNum * height;
    for (let i = 0; i < fillHeight; i++) {
        for (let j = 0; j < fillWidth; j++) {
            const avgArrayI = parseInt(i / splitNum);
            const avgArrayJ = parseInt(j / splitNum);
            const pos = (j + width * i) * 4;
            if (i < imgData.height && j < imgData.width) {
                avgArray[avgArrayI][avgArrayJ] += Math.round((imgDataData[pos] + imgDataData[pos + 1] + imgDataData[pos + 2]) / 3);
            } else {
                avgArray[avgArrayI][avgArrayJ] += 255;
            }
        }
    }
    let avgGray = 0;
    for (let i = 0; i < avgArray.length; i++) {
        for (let j = 0; j < avgArray[0].length; j++) {
            avgArray[i][j] = Math.round(avgArray[i][j] / splitNum / splitNum);
            avgGray += avgArray[i][j];
        }
    }
    avgGray = Math.round(avgGray / avgArray.length / avgArray[0].length);
    //aHash
    console.log('average gray: ' + avgGray);
    console.log('compressed array: ');
    console.log(avgArray);
    let aHashValue = '';
    for (let i = 0; i < avgArray.length; i++) {
        for (let j = 0; j < avgArray[0].length; j++) {
            const e = avgArray[i][j] <= avgGray ? '1' : '0';
            aHashValue += e;
        }
    }
    return aHashValue;
}

//utils
export function imageDataToUrl(imgData) {
    const tCanvas = document.createElement('canvas');
    tCanvas.width = imgData.width;
    tCanvas.height = imgData.height;
    const tCtx = tCanvas.getContext('2d');
    tCtx.putImageData(imgData, 0, 0);
    const dataUrl = tCanvas.toDataURL();
    tCanvas.remove();
    return dataUrl;
}

export function download(imgURL) {
    const aElement = document.createElement('a');
    aElement.download = 'pic';
    aElement.href = imgURL;
    aElement.click();
    aElement.remove();
}