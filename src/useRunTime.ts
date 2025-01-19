import { candelsToInputs } from "./dataset"
import { setDate } from "./statistic"
import * as tf from '@tensorflow/tfjs';

export const useRuntime = async (model: tf.Sequential) => {
    const currentInputs = (await candelsToInputs()).splice(-2)
    const prepInputs = currentInputs.map(i => i.map(v => [v.open, v.high, v.low, v.close, v.volume]))
    console.log('CurrInps:', currentInputs.map(i => new Date(i[i.length - 1].closeTime) + ' ' + i[i.length - 1].realPrice.toFixed(2)))

    // console.log('PrepInps:', prepInputs)
    const res = await (model.predict(tf.tensor3d(prepInputs)) as tf.Tensor).array() as number[][]
    // const [pred2ClosedValue, predClosedValue, lastClosedValue, noClosedValue] = await (model.predict(tf.tensor2d(prepInputs)) as tf.Tensor).array() as number[]
    // const pred2ClosedValue = _pred2ClosedValue[0]
    // const predClosedValue = _predClosedValue[0]
    const lastClosedValue = res[0][0]
    const noClosedValue = res[1][0]

    const closeForce = lastClosedValue * 100
    const noCloseForce = noClosedValue * 100

    // console.log('Last close:', currentInputs[0], lastClosedValue)
    // console.log('No close:', currentInputs[1], noClosedValue)

    // const closeForce = Math.round((lastClosedValue - pred2ClosedValue) * 100)
    // const noCloseForce = Math.round((noClosedValue - predClosedValue) * 100)

    console.log('LifetimePredictions:', [lastClosedValue, noClosedValue])
    console.log('CloseForce:', closeForce, 'NoCloseForce:', noCloseForce)

    const lastCloseInput = currentInputs[currentInputs.length - 2]
    const lastCloseCandle = lastCloseInput[lastCloseInput.length - 1]
    console.log('>>>>> CurrentClosePrice:', new Date(lastCloseCandle.closeTime), lastCloseCandle.realPrice)

    if (closeForce > 60 || closeForce < -40) {
        setDate({
            closeTime: lastCloseCandle.closeTime,
            closePrice: lastCloseCandle.realPrice,
            force: closeForce
        })
    }
}