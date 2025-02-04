#!/usr/bin/env node
import _ from "lodash";
import * as fs from "fs";
import * as topojson from "topojson-server";

import { abort, json_stringify_pretty,log } from "./newquest.utils.js";

//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
//                                                  GET ALL QUEST ELEMENTS
//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

// figure out quest to autobuild
const questId = process.argv[2];
if (!questId) abort("Please pass new quest id as first argument!");

// get list of quests
let quests;
try { quests = JSON.parse(fs.readFileSync(`./index.json`, { encoding: "utf8" })); }
catch (err) { abort(`Failed to parse quests "index.json" file.`, err) };

// check there is an object in quests to autobuild
let questObject = _.find(quests, { id: questId });
if (!questObject) abort(`You should create your new quest settings in "quests/index.json" file!`);

//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
//                                                  CREATE TOPO JSON FILE
//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

// IMPORT BASEMAPS AND ELEMENTS MAPS
let maps = _.map(questObject.maps, function (mapObject, index) {
    let mapFile = JSON.parse(fs.readFileSync(`./${questId}/${mapObject.filePathRelativeToQuestDir}`))
    _.each(mapFile.features, function (feature) {
        var featureProperties = feature.properties;
        if (!featureProperties[mapObject.namePropertyKey]) log.error("Could not find name for feature with properties:", featureProperties);
        feature.properties = {
            name: (mapObject.type == "basemap" ? " " : "") + featureProperties[mapObject.namePropertyKey] + (mapObject.type == "basemap" ? " " : ""), // adding spaces around name of basemaps elements is just a trick to avoid having collisions between elements and basemap pieces having the same name (for example Luxembourg capital being same as Luxembourg country)
            type: mapObject.type,
        };
        _.each(["gq_color", "gq_tags", "gq_helper"], function (key) {
            if (!_.isUndefined(featureProperties[key])) feature.properties[key.replace(/^gq_/, "")] = featureProperties[key];
        });
    });
    return mapFile;
});

// MAKE A SINGLE SIMPLE TOPO FILE FROM MAPS
let topo = topojson.topology(maps);
let allGeometries = [];
_.each(topo.objects, function (object) {
  _.each(object.geometries, function (geometry) {
    allGeometries.push(geometry);
  });
});
topo.objects = {}
topo.objects[questObject.objectsKey] = {
    type: "GeometryCollection",
    geometries: allGeometries,
};

fs.writeFileSync(`./${questId}/map.json`, JSON.stringify(topo));

//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
//\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
