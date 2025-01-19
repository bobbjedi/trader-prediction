import { CONFIG } from "./config"
import { candelsToInputs } from "./dataset"
import * as tf from '@tensorflow/tfjs';

export const useTest = async (model: tf.Sequential, candles: number[][]) => {
    const currentInputs = await candelsToInputs(candles)
    const prepInputs = currentInputs.map(i => i.map(v => [v.open, v.high, v.low, v.close, v.volume]))
    // console.log('CurrInps:', currentInputs.map(i => new Date(i[i.length - 1][6]) + ' ' + i[i.length - 1][5]))

    // console.log('PrepInps:', prepInputs)
    const predicts = (await (model.predict(tf.tensor3d(prepInputs)) as tf.Tensor).array() as number[][]).map(p => p[0])
    // console.log('Predictions:', predicts)
    console.log('****** RT *****')
    const countCheck = CONFIG.FORWARD_COUNT_CHEK + 2


    let counter = 0
    predicts.forEach((p, i) => {
        if (i < 2 || !prepInputs[i + countCheck]) {
            return
        }
        const input = currentInputs[i]


        // if (!(p < 0.4 || p > 0.6)) {
        //     return
        // }
        if (p < 0.7) {
            return
        }
        const force = Math.round(p * 100)



        // const force = Math.round((p - predicts[i - 2]) * 100)

        // if (force < 60) {
        //     return
        // }

        const nextInputs = currentInputs.slice(i + 1, i + countCheck)
        const maxPrice = Math.max(...nextInputs.map(i => i[i.length - 1].realPrice || 0))
        const minPrice = Math.min(...nextInputs.map(i => i[i.length - 1].realPrice || 0))
        const currentPrice = input[input.length - 1].realPrice
        const currentTime = input[input.length - 1].closeTime

        const targetChange = ((maxPrice - currentPrice) / currentPrice) * 100;

        console.log(`#${counter++}`, +targetChange.toFixed(2), 'Force:', force, new Date(currentTime), 'Price', currentPrice, '->', maxPrice, 'change:', '->', minPrice, 'change:', ((minPrice - currentPrice) / currentPrice * 100).toFixed(2))
    })

}
