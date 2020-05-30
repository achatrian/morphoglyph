<template>
    <v-data-table
            class="table-outer"
            :headers="headers"
            :items="entries"
            no-results-text="No selected bindings"
            disable-initial-sort
    >
        <template slot="items" slot-scope="props">
            <td class="text-xs-right table-tile">{{props.item.name}}</td>
            <td class="text-xs-right table-tile">{{props.item.shape}}</td>
            <td class="text-xs-right table-tile">{{props.item.element}}</td>
            <td class="text-xs-right table-tile">{{props.item.field}}</td>
        </template>
    </v-data-table>
</template>

<script>
    const headers = [
        {text: 'Glyph', value: 'name'},
        {text: 'Shape', value: 'shape'},
        {text: 'Element', value: 'element'},
        {text: 'Feature', value: 'field'}
    ]

    export default {
        name: "BindingsTable",
        props: {bindings: {type: Array, default: ()=>[]}},
        data () {
            return {
                headers: headers
            }
        },
        computed: {
            entries () {
                const entries = [...this.bindings]
                if (entries.length < 5) {
                    while (!(entries.length >= 5)) {
                        entries.push({
                            name: '',
                            shape: '',
                            element: '',
                            field: ''
                        })
                    }
                }
                return entries
            }
        }
    }
</script>

<style scoped>
    .table-outer {
        z-index: 3;
        margin-top: 5%;
        margin-right: 10%;
        max-height: 200px;
    }

    .table-tile {
        max-height: 10px;
    }
</style>