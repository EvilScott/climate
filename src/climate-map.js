import React from 'react';
import L from 'leaflet';
import List from './list'
import store from './store.js'
import './style/climate-map.css';

const DEFAULT_CENTER = [38, -95];
const DEFAULT_ZOOM = 5;
const TILE_URL = 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ATTRIBUTION_TEXT = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, ' +
    'Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community | Data from NOAA API';

class ClimateMap extends React.Component {
    constructor(props) {
        super(props);

        store.subscribe(this.handleStoreChange.bind(this));

        this.stations = require('./data/stations.json').reduce((stations, state) => {
            stations.set(state.name, L.layerGroup(state.stations.map((station) => {
                return L.circleMarker([station.lat, station.lng], {
                    name: station.name,
                    color: '#333',
                    fill: true,
                    fillColor: '#ff6600',
                    fillOpacity: 1,
                    opacity: 1,
                    radius: 6,
                    weight: 2
                }).bindPopup(station.name);
            })));
            return stations;
        }, new Map());

        this.regionBoundaries = L.geoJson(require('./data/states.json'), {
            fill: false,
            filter: (region) => region.properties.NAME !== 'Puerto Rico'
        });
    }

    componentDidMount() {
        this.map = L.map('climate-map', {
            attributionControl: false,
            center: DEFAULT_CENTER,
            layers: [
                L.tileLayer(TILE_URL),
                this.regionBoundaries,
                ...this.stations.values()
            ],
            minZoom: 3,
            zoom: DEFAULT_ZOOM
        }).addControl(L.control.attribution({ position: 'bottomleft' }).addAttribution(ATTRIBUTION_TEXT));
    }

    handleStoreChange() {
        const state = store.getState();
        let boundsArray = [];

        this.regionBoundaries
            .removeFrom(this.map)
            .setStyle((region) => {
                if (state.region === null || state.region === region.properties.NAME) {
                    return { color: '#3388ff' };
                } else {
                    return { color: 'rgba(0,0,0,0)' };
                }
            })
            .eachLayer((region) => {
                if (state.region === null || state.region === region.feature.properties.NAME) {
                    boundsArray.push(region.getBounds());
                }
            })
            .addTo(this.map)
            .bringToBack();

        this.map.fitBounds(boundsArray)
    }

    render() {
        return (
            <div>
                <div id="climate-map" className="climate-map" />
                <List stations={ this.stations } />
            </div>
        );
    }
}

export default ClimateMap;
