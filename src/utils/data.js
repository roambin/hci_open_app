// /**
//  * @license
//  * Copyright 2018 Google LLC. All Rights Reserved.
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  * http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  * =============================================================================
//  */

import * as tf from '@tensorflow/tfjs';

// const IMAGE_SIZE = 784; // 图片的像素大小
// const NUM_CLASSES = 10; // 要分类的数量
// const NUM_DATASET_ELEMENTS = 65000; // 数据集大小

// const NUM_TRAIN_ELEMENTS = 55000;   // 训练及大小
// const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS;    // 测试集大小

// const MNIST_IMAGES_SPRITE_PATH =
//     'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png'; // 雪碧图-来源
// const MNIST_LABELS_PATH =
//     'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8'; // 标签来源

// /**
//  * A class that fetches the sprited MNIST dataset and returns shuffled batches.
//  *
//  * NOTE: This will get much easier. For now, we do data fetching and
//  * manipulation manually.
//  */
// export class MnistData {
//     constructor() {
//         this.shuffledTrainIndex = 0;    // 打乱训练集的索引为0？
//         this.shuffledTestIndex = 0;     // 打乱测试集的索引为0？
//     }

//     // 加载图片
//     async load() {
//         // Make a request for the MNIST sprited image.
//         const img = new Image();    // 相当于创建了一个Img标签。
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         const imgRequest = new Promise((resolve, reject) => {
//             img.crossOrigin = '';   // 设置跨域头为空。其实没必要写这句话？
//             img.onload = () => {
//                 img.width = img.naturalWidth;   // 设置图片的宽度为图片的原始宽度。
//                 img.height = img.naturalHeight; // 设置图片的高度为图片的原始高度。

//                 const datasetBytesBuffer =
//                     new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4); // 创建一个大小为 数据数量*图像尺寸*4 的二进制数据缓冲区（即内存）（*4是因为后续的浮点字节为32位？或者rgba？）

//                 const chunkSize = 5000; // 块大小？
//                 canvas.width = img.width;
//                 canvas.height = chunkSize;

//                 for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) { // 一共分成了 数据数量/块大小 个块。
//                     const datasetBytesView = new Float32Array( // 创建32位浮点类型的视图。长度为 图像的像素*块大小，缓冲区（即内存）为datesetBytesBuffer，偏移为图像的像素*块大小*4*块编号
//                         datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
//                         IMAGE_SIZE * chunkSize);

//                     // 从image的（0，块的序号*块的尺寸）进行裁剪，裁剪的宽度为图片的宽度，裁剪的高度为一个块的大小。布置到canvas的0，0位置，宽度为图片的宽度，高度为块大小。
//                     ctx.drawImage(
//                         img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width,
//                         chunkSize);

//                     // 将整个canvas返回一个ImageData对象。 
//                     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//                     for (let j = 0; j < imageData.data.length / 4; j++) {
//                         // All channels hold an equal value since the image is grayscale, so
//                         // just read the red channel.
//                         datasetBytesView[j] = imageData.data[j * 4] / 255;
//                     }
//                 }
//                 // 32位浮点数数组视图
//                 this.datasetImages = new Float32Array(datasetBytesBuffer);

//                 resolve();
//             };
//             img.src = MNIST_IMAGES_SPRITE_PATH;   // 请求雪碧图
//         });

//         const labelsRequest = fetch(MNIST_LABELS_PATH); // 向后台请求
//         const [imgResponse, labelsResponse] =
//             await Promise.all([imgRequest, labelsRequest]); // 获取雪碧图、标签

//         this.datasetLabels = new Uint8Array(await labelsResponse.arrayBuffer()); // 构建一个"8位无符号整型"数组，创建时内容被初始化为0，数据缓冲区    

//         // 创建一个无序的训练集/测试集索引进行训练和验证
//         this.trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);  // 训练索引数组：创建一个具有给定数量的随机索引的新数组。
//         this.testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);    // 测试索引数组：创建一个具有给定数量的随机索引的新数组。

//         // Slice the the images and labels into train and test sets.
//         this.trainImages =
//             this.datasetImages.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);   // 切割出图片训练集
//         this.testImages = this.datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);    // 切割出图片测试集，train的最后一个->final
//         this.trainLabels =
//             this.datasetLabels.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);  // 切割出标签训练集
//         this.testLabels =
//             this.datasetLabels.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);     // 切割出标签测试集
//     }

//     // 取下一批训练集
//     nextTrainBatch(batchSize) {
//         return this.nextBatch(
//             batchSize, [this.trainImages, this.trainLabels], () => {
//                 this.shuffledTrainIndex =
//                     (this.shuffledTrainIndex + 1) % this.trainIndices.length;
//                 return this.trainIndices[this.shuffledTrainIndex];
//             });
//     }

//     // 取下一批测试集
//     nextTestBatch(batchSize) {
//         return this.nextBatch(batchSize, [this.testImages, this.testLabels], () => {
//             this.shuffledTestIndex =
//                 (this.shuffledTestIndex + 1) % this.testIndices.length;
//             return this.testIndices[this.shuffledTestIndex];
//         });
//     }

//     // 取下一批数据
//     nextBatch(batchSize, data, index) {
//         const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);  // 批处理数据*图片尺寸
//         const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);   // 批处理数据*要分类的数量

//         for (let i = 0; i < batchSize; i++) {
//             const idx = index();

//             // 添加image到内存区域
//             const image =
//                 data[0].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
//             batchImagesArray.set(image, i * IMAGE_SIZE);

//             // 添加label到内存区域
//             const label =
//                 data[1].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
//             batchLabelsArray.set(label, i * NUM_CLASSES);
//         }

//         // 构造张量
//         const xs = tf.tensor2d(batchImagesArray, [batchSize, IMAGE_SIZE]);          // 一个具有两个元素的一维数组。批处理的数据量大小,图片的尺寸
//         const labels = tf.tensor2d(batchLabelsArray, [batchSize, NUM_CLASSES]);     // 批处理的数据量大小*分类的种类

//         return { xs, labels };
//     }
// }

/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

const IMAGE_SIZE = 784;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;

const NUM_TRAIN_ELEMENTS = 55000;
const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS;

const MNIST_IMAGES_SPRITE_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const MNIST_LABELS_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

/**
 * A class that fetches the sprited MNIST dataset and returns shuffled batches.
 *
 * NOTE: This will get much easier. For now, we do data fetching and
 * manipulation manually.
 */
export class MnistData {
  constructor() {
    this.shuffledTrainIndex = 0;
    this.shuffledTestIndex = 0;
  }

  async load() {
    // Make a request for the MNIST sprited image.
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgRequest = new Promise((resolve, reject) => {
      img.crossOrigin = '';
      img.onload = () => {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;

        const datasetBytesBuffer =
            new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4);

        const chunkSize = 5000;
        canvas.width = img.width;
        canvas.height = chunkSize;

        for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
          const datasetBytesView = new Float32Array(
              datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
              IMAGE_SIZE * chunkSize);
          ctx.drawImage(
              img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width,
              chunkSize);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          for (let j = 0; j < imageData.data.length / 4; j++) {
            // All channels hold an equal value since the image is grayscale, so
            // just read the red channel.
            datasetBytesView[j] = imageData.data[j * 4] / 255;
          }
        }
        this.datasetImages = new Float32Array(datasetBytesBuffer);

        resolve();
      };
      img.src = MNIST_IMAGES_SPRITE_PATH;
    });

    const labelsRequest = fetch(MNIST_LABELS_PATH);
    const [imgResponse, labelsResponse] =
        await Promise.all([imgRequest, labelsRequest]);

    this.datasetLabels = new Uint8Array(await labelsResponse.arrayBuffer());
    // Create shuffled indices into the train/test set for when we select a
    // random dataset element for training / validation.
    this.trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);
    this.testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);

    // Slice the the images and labels into train and test sets.
    this.trainImages =
        this.datasetImages.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    this.testImages = this.datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    this.trainLabels =
        this.datasetLabels.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);
    this.testLabels =
        this.datasetLabels.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);
  }

  nextTrainBatch(batchSize) {
    return this.nextBatch(
        batchSize, [this.trainImages, this.trainLabels], () => {
          this.shuffledTrainIndex =
              (this.shuffledTrainIndex + 1) % this.trainIndices.length;
          return this.trainIndices[this.shuffledTrainIndex];
        });
  }

  nextTestBatch(batchSize) {
    return this.nextBatch(batchSize, [this.testImages, this.testLabels], () => {
      this.shuffledTestIndex =
          (this.shuffledTestIndex + 1) % this.testIndices.length;
      return this.testIndices[this.shuffledTestIndex];
    });
  }

  nextBatch(batchSize, data, index) {
    const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);
    const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);

    for (let i = 0; i < batchSize; i++) {
      const idx = index();

      const image =
          data[0].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
      batchImagesArray.set(image, i * IMAGE_SIZE);

      const label =
          data[1].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
      batchLabelsArray.set(label, i * NUM_CLASSES);
    }

    const xs = tf.tensor2d(batchImagesArray, [batchSize, IMAGE_SIZE]);
    const labels = tf.tensor2d(batchLabelsArray, [batchSize, NUM_CLASSES]);

    return {xs, labels};
  }
}