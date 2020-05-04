<template>
    <v-card id="chart-controller" v-if="chartController">
        <v-divider/>
        <span class="app-title light--text subheading">Chart Controller:</span>
        <div class="controls-container">
            <v-select
                    class="control-item"
                    :items="numericFields"
                    dense
                    label="x-axis"
                    v-model="xField"
            />
            <v-select
                    class="control-item"
                    :items="numericFields"
                    dense
                    label="y-axis"
                    v-model="yField"
            />
<!--            <v-tooltip class="tooltip"-->
<!--                       open-delay="700"-->
<!--                       bottom>-->
<!--                <v-btn icon class="primary light&#45;&#45;text" @click="drawChart_">-->
<!--                    <v-icon>scatter_plot</v-icon>-->
<!--                </v-btn>-->
<!--                <span>View scatterplot of selected features</span>-->
<!--            </v-tooltip>-->
            <v-btn icon class="primary light--text" @click="drawChart_">
                <v-icon>scatter_plot</v-icon>
            </v-btn>
            <v-btn icon class="secondary dark--text" @click="setChartState(false)">
                <v-icon>close</v-icon>
            </v-btn>
<!--            <v-tooltip class="tooltip"-->
<!--                       open-delay="700"-->
<!--                       bottom>-->
<!--                <v-btn icon class="secondary dark&#45;&#45;text" @click="setChartState(false)">-->
<!--                    <v-icon>close</v-icon>-->
<!--                </v-btn>-->
<!--                <span>Return to standard grid view</span>-->
<!--            </v-tooltip>-->
        </div>
        <v-divider/>
    </v-card>
</template>


<script>
    import {mapState, mapActions} from 'vuex'

    export default {
        name: "ChartController",
        data () {
            return {
                xField: '',
                yField: '',
                chartMetaData: {}
            }
        },
        computed: {
            ...mapState({
                chartController: state => state.app.chartController,
                fieldTypes: state => state.backend.fieldTypes,
                orderedData: state => state.backend.orderedData,
            }),
            numericFields () {
                const numericFields = []
                for (let [field, type] of Object.entries(this.fieldTypes)) {
                    if (type === Number) {
                        numericFields.push(field)
                    }
                }
                return numericFields
            }
        },
        methods: {
            ...mapActions({
                activateSnackbar: 'app/activateSnackbar',
                drawChart: 'app/drawChart',
                setChartState: 'app/setChartState'
            }),
            drawChart_ () {
                if (!this.xField || !this.yField) {
                    this.activateSnackbar({
                        text: 'x and y features must be selected to plot chart',
                        color: 'warn',
                        timeout: 2000
                    })
                } else {
                    this.drawChart({
                        xField: this.xField,
                        yField: this.yField
                    })
                }
            }
        }
    }
</script>

<style scoped>
    .controls-container{
        display: flex;
        justify-content: space-around;
        align-items: center;
    }

    .control-item{
        flex: 0 1 auto;
        max-width: 90px
    }

    .app-title{
        display: block;
        margin-left: 5%;
    }
</style>
