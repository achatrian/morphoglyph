<template>
    <v-card class="light elevation-5 card" v-if="glyphs.length === 0">
        <div id="enclosure">
            <div id="title">Welcome to MorphoGlyph!</div>
            <div id="description">
                MorphoGlyph enables rapid construction of glyph data visualizations.
                <ul>
                    <li>To start building your glyph, upload your data file</li>
                    <app-load-data class="button"/>
                    <li>Now let's check whether your data has loaded</li>
                    <app-sheet class="button"/>
                    <li>The studio (right-hand menu) is used to create glyphs</li>
                    <li>Enter a glyph name, select the glyph type, its shape, and what feature will be used to name each data-point</li>
                    <li>Bind elements to data features, and modify the glyph and elements appearance</li>
                    <li>To open the studio, click start:</li>
                </ul>
                <v-btn
                        color="secondary"
                        class="button primary--text font-weight-bold"
                        large
                        @click="setStudioDrawerState(true)"
                >
                    START
                </v-btn>
                <hr style="width: 100%; background: #673AB7; margin: auto; height: 2px; border: 0">
                <p>Or load an existing example:</p>
                <v-flex>
                    <v-layout justify-center>
                        <v-btn color="blue" class="white--text" @click="loadExample('BCL_data.csv')">Cell data</v-btn>
<!--                        <v-btn color="green" class="white&#45;&#45;text">Gland data</v-btn>-->
<!--                        <v-btn color="red" class="white&#45;&#45;text">Mouse data</v-btn>-->
                    </v-layout>
                </v-flex>
            </div>
        </div>
    </v-card>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import LoadData from '../../header/buttons/LoadData'
import Sheet from '../../footer/Sheet'

export default {
    name: "WelcomeCard",
    components: {
        'app-load-data': LoadData,
        'app-sheet': Sheet
    },
    computed: {
      ...mapState({
              glyphs: state => state.glyph.project.glyphs,
          })
    },
    methods: {
        ...mapActions({
            setStudioDrawerState: 'app/setStudioDrawerState',
            loadExample: 'template/loadExample'
        })
    }
}
</script>

<style scoped>
    .card{
        min-height: 70%;
        min-width: 60%
    }

    #enclosure{
        padding: 5% 5% 5% 5%;
        border-style: solid;
        border-color: #673AB7;
        background-color: white;
    }

    #title{
        text-align: center;
        font-size: 30px;
        font-weight: bold;
        color: #673AB7;
    }

    #description{
        margin: 5% 5% 5% 5%;
        text-align: justify;
        font-size: 16px;
    }

    .button{
        display: block;
        margin-left: auto;
        margin-right: auto;
    }
</style>
