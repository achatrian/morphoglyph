// import Chart from 'chart.js'
import paper from 'paper'

const darkColor = '#424242'
const lighterColor = '#757575'

export default function drawAxes(options = {
    offsetFraction: 0.1, // fractional space between canvas border and origin
    endFraction: 0.05, // fractional space added at the axes length
    strokeWidth: 1.5,
    strokeColor: darkColor,
    minTickNumber: 6, // tick number more important than tick spacing
    tickSpacing: 100,
}) {

    const chartLayer = new paper.Layer({name: 'chart'}) // TODO use this or temp layer ?
    chartLayer.activate()
    const {offsetFraction, endFraction, strokeWidth, strokeColor, tickSpacing, minTickNumber} = options
    if (offsetFraction < endFraction) {
        throw Error('Cannot extend axis out of canvas (enforce offsetFraction < endFraction)')
    }
    const viewWidth = paper.view.viewSize.width
    const viewHeight = paper.view.viewSize.height
    const origin = [offsetFraction*viewWidth, (1 - offsetFraction)*viewHeight]
    const xEndPoint = [(1 - offsetFraction + endFraction)*viewWidth, origin[1]]
    const yEndPoint = [origin[0], (offsetFraction - endFraction)*viewHeight]
    const xAxis = new paper.Path.Line(new paper.Point(origin), new paper.Point(xEndPoint))
    const yAxis = new paper.Path.Line(new paper.Point(origin), new paper.Point(yEndPoint))
    xAxis.strokeWidth = strokeWidth
    xAxis.strokeColor = strokeColor
    yAxis.strokeWidth = strokeWidth
    yAxis.strokeColor = strokeColor
    const xSpan = (1 - offsetFraction)*viewWidth - origin[0]
    const ySpan = origin[1] - offsetFraction*viewHeight
    let numXTicks = Math.round(xSpan/tickSpacing) + 1
    let numYTicks = Math.round(ySpan/tickSpacing) + 1
    const xTickSpacing = numXTicks >= minTickNumber ? tickSpacing : xSpan / (minTickNumber + 1)
    const yTickSpacing = numYTicks >= minTickNumber ? tickSpacing : ySpan / (minTickNumber + 1)
    numXTicks = numXTicks >= minTickNumber ? numXTicks : minTickNumber
    numYTicks = numYTicks >= minTickNumber ? numYTicks : minTickNumber
    const distFromXAxis = 30 // number of pixels between axis and number
    let pointTextLength
    // write ticks on x and y axes
    let xSpanEnd, ySpanEnd // store final axis position (corresponds to 1.0)
    for (let ix = 0; ix<numXTicks; ix++) {
        // write tick label
        let xPointText = new paper.PointText({
            point: [origin[0] + ix*xTickSpacing, origin[1] + distFromXAxis],
            content: (1.0/(numXTicks - 1) * ix).toFixed(2), // converts into string
            fillColor: 'black',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            fontSize: 15
        })
        // draw grid line
        let verGridLine = new paper.Path.Line(
            new paper.Point(origin[0] + ix*xTickSpacing, origin[1]),
            new paper.Point(origin[0] + ix*xTickSpacing, yEndPoint[1])
        )
        verGridLine.strokeWidth = strokeWidth/2
        verGridLine.strokeColor = lighterColor
        verGridLine.strokeCap = 'round'
        verGridLine.dashArray = [10, 12]
        pointTextLength = xPointText.bounds.width
        xSpanEnd = origin[0] + ix*xTickSpacing
    }
    const distFromYAxis = distFromXAxis + pointTextLength // must include length of point text
    for (let iy = 0; iy<numYTicks; iy++) {
        // write tick label
        new paper.PointText({
            point: [origin[0] - distFromYAxis, origin[1] - iy*yTickSpacing],
            content: (1.0/(numYTicks - 1) * iy).toFixed(2), // converts into string
            fillColor: 'black',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            fontSize: 15
        })
        // draw grid line
        let horGridLine = new paper.Path.Line(
            new paper.Point(origin[0], origin[1] - iy*yTickSpacing),
            new paper.Point(xEndPoint[0], origin[1] - iy*yTickSpacing)
        )
        horGridLine.strokeWidth = strokeWidth/2
        horGridLine.strokeColor = lighterColor
        horGridLine.strokeCap = 'round'
        horGridLine.dashArray = [10, 12]
        ySpanEnd = origin[1] - iy*yTickSpacing
    }
    // return axes details, used to compute glyph positions
    return {origin: origin, xSpanEnd: xSpanEnd, ySpanEnd: ySpanEnd}
}

// export default function drawChart(canvasElement, xData, yData, animation = false) {
//     const ctx = canvasElement.getContext('2d')
//     const xyData = []
//     for (let i=0; i < xData.length; i++) {
//         xyData.push({x: xData[i], y: yData[i]})
//     }
//     //eslint-disable-next-line no-unused-vars
//     const scatterChart = new Chart(ctx, {
//         type: 'scatter',
//         data: {
//             datasets: [{
//                 label: 'Scatter Dataset',
//                 data: xyData
//             }]
//         },
//         options: {
//             scales: {
//                 xAxes: [{
//                     type: 'linear',
//                     position: 'bottom'
//                 }]
//             },
//             animation: animation
//         }
//     })
//     return scatterChart
// }
