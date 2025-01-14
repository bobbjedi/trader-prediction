import * as tf from '@tensorflow/tfjs';
import { getHistoricalCandles } from './binance';
import { CONFIG } from './config';
import { prepareDataset, splitDataset } from './dataset';
import { visualizeResults } from './visualizeResults';

export async function trainModel() {
    // Шаг 1: Загрузка и подготовка данных
    const candles = await getHistoricalCandles('BTCUSDT', CONFIG.TIMEFRAME, CONFIG.CANDLE_LIMIT);
    const dataset = prepareDataset(candles, CONFIG.INPUT_SIZE);
    //   const { trainData, testData } = splitDataset(dataset);
    const trainData = dataset
    const testData = dataset

    // Шаг 2: Разделяем данные на вход (inputs) и метки (targets)
    const trainInputs = trainData.map(sample => sample.input.flat());
    const trainLabels = trainData.map(sample => sample.target);

    const testInputs = testData.map(sample => sample.input.flat());
    const testLabels = testData.map(sample => sample.target);
    const testMaxClose = testData.map(sample => sample.maxClose || 0);

    // Преобразуем данные в тензоры
    const trainInputsTensor = tf.tensor2d(trainInputs);
    const trainLabelsTensor = tf.tensor2d(trainLabels);

    const testInputsTensor = tf.tensor2d(testInputs);
    const testLabelsTensor = tf.tensor2d(testLabels);

    // Шаг 3: Создание модели
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [CONFIG.INPUT_SIZE * 5] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

    // model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 1256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Активация для вероятностей

    // Шаг 4: Компиляция модели
    // model.compile({
    //     optimizer: tf.train.adam(0.00001),
    //     loss: 'binaryCrossentropy', // Функция потерь для бинарной классификации
    //     metrics: ['accuracy'], // Для отслеживания точности
    // });
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['mse'],
    });

    // Шаг 5: Обучение модели
    await model.fit(trainInputsTensor, trainLabelsTensor, {
        epochs: 2000,
        batchSize: 32,
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch: ${epoch + 1}, Loss: ${logs?.loss}, MSE: ${logs?.mse}`);
                if (epoch % 5 === 0) {
                    const predictedTestData = model.predict(testInputsTensor) as tf.Tensor;
                    const predictedDataArray = await predictedTestData.array() as number[][];
                    const predictedTestDataArray = predictedDataArray.map((data) => data[0]);
                    const closeTestLabels = testLabels.map(label => label[0]); // Берем только close

                    visualizeResults(closeTestLabels, predictedTestDataArray, testMaxClose, 'chart');
                    console.log('Render')
                }

            },
        },
        validationData: [testInputsTensor, testLabelsTensor],
    });

    // Шаг 6: Оценка на тестовых данных
    const res = await model.evaluate(testInputsTensor, testLabelsTensor) as tf.Scalar[];
    console.log(`Test Loss: ${res?.[0]}`);
    console.log(`Test MSE: ${res?.[1]}`);


    // Шаг 7: Визуализация результатов
    const predictedTestData = model.predict(testInputsTensor) as tf.Tensor;
    const predictedDataArray = await predictedTestData.array() as number[][];
    const predictedTestDataArray = predictedDataArray.map((data) => data[0]);
    const closeTestLabels = testLabels.map(label => label[0]); // Берем только close

    visualizeResults(closeTestLabels, predictedTestDataArray, testMaxClose, 'chart');
}
