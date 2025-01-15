import { set } from "lodash"
import { getPrice } from "./binance"

const statistic: Record<number, {
    closeTime: number
    currentTime: number
    priceFromBinance: number
    closePrice: number
    force: number
}> = {}


export const setDate = async (data: {
    closeTime: number
    closePrice: number
    force: number
}) => {
    if (statistic[data.closeTime]) {
        return console.log('Already exist', new Date(data.closeTime))
    }

    statistic[data.closeTime] = {
        closeTime: data.closeTime,
        currentTime: Date.now(),
        priceFromBinance: await getPrice('BTCUSDT'),
        closePrice: data.closePrice,
        force: data.force
    }
    console.log('Added stat:', statistic[data.closeTime])
}

setInterval(() => {
    console.log('******** Statistic ********')
    Object.keys(statistic).forEach(key => {
        const stat = statistic[Number(key)]
        console.log(`
            Closetime ${new Date(stat.closeTime)},
            SignalTime ${new Date(stat.currentTime)},
            signalPrice ${stat.priceFromBinance}
            closePrice ${stat.closePrice}
            force ${stat.force}
            `)
    })
}, 10_000)