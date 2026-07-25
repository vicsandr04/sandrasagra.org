//
// ============================================================
// SANDRASAGRA.ORG
// Universe Mode 2
//
// Part 1
// Boot • Intro • Scene • Loading
// ============================================================
//

"use strict";

//
// ------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------
//

const INTRO = {

    titleDelay: 500,

    subtitleDelay: 1700,

    searchDelay: 3000,

    universeDelay: 4200,

    activateDelay: 6200

};


const STAR = {

    radius: 2.2,

    glow: 4,

    opacity: 0.15

};


const CAMERA = {

    x: 0,

    y: 0,

    zoom: 1

};


//
// ------------------------------------------------------------
// GLOBAL STATE
// ------------------------------------------------------------
//

let svg;

let rootGroup;

let linkLayer;

let nodeLayer;

let labelLayer;

let simulation;

let width = window.innerWidth;

let height = window.innerHeight;

let graph = null;

let nodeSelection;

let linkSelection;

let labelSelection;

let focusedPerson = null;

let universeReady = false;

let introComplete = false;


//
// ------------------------------------------------------------
// STARTUP
// ------------------------------------------------------------
//

document.addEventListener(

    "DOMContentLoaded",

    () => {

        createSVG();

        introSequence();

        setupSearch();

    }

);

//
// ------------------------------------------------------------
// SVG
// ------------------------------------------------------------
//

function createSVG() {

    svg = d3
        .select("#universe")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    rootGroup = svg
        .append("g")
        .attr("class", "camera");

    linkLayer = rootGroup
        .append("g")
        .attr("class", "links");

    nodeLayer = rootGroup
        .append("g")
        .attr("class", "nodes");

    labelLayer = rootGroup
        .append("g")
        .attr("class", "labels");

    window.addEventListener(
        "resize",
        resizeUniverse
    );

}

//
// ------------------------------------------------------------
// RESIZE
// ------------------------------------------------------------
//

function resizeUniverse() {

    width = window.innerWidth;

    height = window.innerHeight;

    svg

        .attr("width", width)

        .attr("height", height);

    if (simulation) {

        simulation.force(

            "center",

            d3.forceCenter(

                width / 2,

                height / 2

            )

        );

        simulation.alpha(0.3).restart();

    }

}

//
// ------------------------------------------------------------
// INTRO
// ------------------------------------------------------------
//

function introSequence() {

    setTimeout(

        () => {

            loadUniverse();

        },

        INTRO.universeDelay

    );

}

//
// ------------------------------------------------------------
// LOAD GRAPH
// ------------------------------------------------------------
//

async function loadUniverse() {

    const response = await fetch(

        "/graph.json"

    );

    graph = await response.json();

    initialiseUniverse(

        graph

    );

}

//
// ------------------------------------------------------------
// BUILD SCENE
// ------------------------------------------------------------
//

function initialiseUniverse(data) {

    universeReady = true;

    buildLinks(

        data.links

    );

    buildNodes(

        data.nodes

    );

    buildLabels(

        data.nodes

    );

    buildSimulation(

        data

    );

    fadeUniverse();

}

//
// ------------------------------------------------------------
// FADE IN
// ------------------------------------------------------------
//

function fadeUniverse() {

    d3.selectAll(

        ".family-link"

    )

    .style(

        "opacity",

        0

    )

    .transition()

    .duration(

        3000

    )

    .style(

        "opacity",

        0.06

    );

    d3.selectAll(

        ".family-node"

    )

    .style(

        "opacity",

        0

    )

    .transition()

    .duration(

        2500

    )

    .style(

        "opacity",

        1

    );

    setTimeout(

        () => {

            document.body.classList.add(

                "universe-active"

            );

            introComplete = true;

        },

        1200

    );

}

//
// ============================================================
// PART 2
// Universe Builder
// ============================================================
//

function buildLinks(links) {

    linkSelection = linkLayer

        .selectAll("line")

        .data(links)

        .enter()

        .append("line")

        .attr("class", "family-link")

        .attr("stroke", "rgba(255,255,255,.15)")

        .attr("stroke-width", d =>

            d.type === "spouse" ? 1.5 : 1

        )

        .style("opacity", 0);

}

function buildNodes(nodes) {

    nodeSelection = nodeLayer

        .selectAll("circle")

        .data(nodes)

        .enter()

        .append("circle")

        .attr("class", "family-node")

        .attr("r", STAR.radius)

        .attr("fill", "white")

        .attr("opacity", STAR.opacity)

        .style("filter","drop-shadow(0 0 4px rgba(255,255,255,.65))")

        .call(enableDragging())

        .on("mouseover", nodeHover)

        .on("mouseout", nodeOut)

        .on("click", nodeClick);

}

function buildLabels(nodes) {

    labelSelection = labelLayer

        .selectAll("text")

        .data(nodes)

        .enter()

        .append("text")

        .text(d =>

            d.display_name || d.name

        )

        .attr("font-size","12px")

        .attr("fill","white")

        .attr("text-anchor","middle")

        .style("pointer-events","none")

        .style("opacity",0);

}

function buildSimulation(data) {

    simulation =

        d3.forceSimulation(data.nodes)

            .force(

                "link",

                d3.forceLink(data.links)

                    .id(d => d.id)

                    .distance(linkDistance)

            )

            .force(

                "charge",

                d3.forceManyBody()

                    .strength(-60)

            )

            .force(

                "center",

                d3.forceCenter(

                    width/2,

                    height/2

                )

            )

            .force(

                "collision",

                d3.forceCollide()

                    .radius(8)

            )

            .force(

                "x",

                d3.forceX(width/2)

                    .strength(.01)

            )

            .force(

                "y",

                d3.forceY(height/2)

                    .strength(.01)

            )

            .alpha(1)

            .alphaDecay(.02)

            .velocityDecay(.30)

            .on(

                "tick",

                tickUniverse

            );

}

function tickUniverse() {

    linkSelection

        .attr(

            "x1",

            d => d.source.x

        )

        .attr(

            "y1",

            d => d.source.y

        )

        .attr(

            "x2",

            d => d.target.x

        )

        .attr(

            "y2",

            d => d.target.y

        );

    nodeSelection

        .attr(

            "cx",

            d => d.x

        )

        .attr(

            "cy",

            d => d.y

        );

    labelSelection

        .attr(

            "x",

            d => d.x

        )

        .attr(

            "y",

            d => d.y - 12

        );

}

function linkDistance(link) {

    switch(link.type) {

        case "spouse":

            return 35;

        case "parent":

            return 55;

        default:

            return 70;

    }

}

function enableDragging() {

    return d3.drag()

        .on(

            "start",

            dragStart

        )

        .on(

            "drag",

            dragging

        )

        .on(

            "end",

            dragEnd

        );

}

function dragStart(event,d) {

    if(!event.active)

        simulation.alphaTarget(.3).restart();

    d.fx=d.x;

    d.fy=d.y;

}

function dragging(event,d){

    d.fx=event.x;

    d.fy=event.y;

}

function dragEnd(event,d){

    if(!event.active)

        simulation.alphaTarget(0);

    d.fx=null;

    d.fy=null;

}

//
// ============================================================
// PART 3
// Search • Camera • Focus
// ============================================================
//

function setupSearch() {

    const input = document.getElementById(
        "relation-input"
    );

    if (!input)
        return;

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Enter"
            )
                return;

            const value =
                input.value.trim().toLowerCase();

            if (!value)
                return;

            const person =
                graph.nodes.find(

                    p =>

                        (p.display_name || p.name)
                        .toLowerCase()
                        .includes(value)

                );

            if (!person)
                return;

            focusPerson(person);

        }

    );

}

//
// ------------------------------------------------------------
// FOCUS PERSON
// ------------------------------------------------------------
//

function focusPerson(person) {

    focusedPerson = person.id;

    flyCameraTo(person);

    illuminateFamily(person.id);

}

//
// ------------------------------------------------------------
// FAMILY
// ------------------------------------------------------------
//

async function illuminateFamily(id) {

    const response = await fetch(

        "/api/network/" + id

    );

    const family = await response.json();

    const keep =

        new Set(

            family.nodes.map(

                n => n.id

            )

        );

    nodeSelection

        .transition()

        .duration(800)

        .attr(

            "r",

            d =>

                keep.has(d.id)

                ? 4.5

                : STAR.radius

        )

        .attr(

            "opacity",

            d =>

                keep.has(d.id)

                ? 1

                : .12

        );

    linkSelection

        .transition()

        .duration(800)

        .style(

            "opacity",

            d =>

                keep.has(d.source.id)

                &&

                keep.has(d.target.id)

                ? .35

                : .02

        );

    labelSelection

        .transition()

        .duration(600)

        .style(

            "opacity",

            d =>

                keep.has(d.id)

                ? 1

                : 0

        );

}

//
// ============================================================
// PART 4
// Hover • Tooltip • Animation • Finish
// ============================================================
//

let tooltip = null;

createTooltip();
startAmbientMotion();

//
// ------------------------------------------------------------
// TOOLTIP
// ------------------------------------------------------------
//

function createTooltip() {

    tooltip = d3

        .select("body")

        .append("div")

        .attr("id","tooltip")

        .style("position","absolute")

        .style("pointer-events","none")

        .style("opacity",0)

        .style("padding","14px 18px")

        .style("border-radius","14px")

        .style("background","rgba(0,0,0,.75)")

        .style("backdrop-filter","blur(12px)")

        .style("color","white")

        .style("font-family","inherit")

        .style("font-size","13px")

        .style("line-height","1.5")

        .style("border","1px solid rgba(255,255,255,.12)");

}

//
// ------------------------------------------------------------
// NODE EVENTS
// ------------------------------------------------------------
//

function nodeHover(event,d){

    d3.select(this)

        .transition()

        .duration(150)

        .attr("r",6)

        .attr("opacity",1);

    tooltip

        .style("opacity",1)

        .html(

            "<strong>"

            +(d.display_name||d.name)+

            "</strong>"

        )

        .style(

            "left",

            (event.pageX+18)+"px"

        )

        .style(

            "top",

            (event.pageY-10)+"px"

        );

}

function nodeOut(){

    nodeSelection

        .filter(

            d=>d.id!==focusedPerson

        )

        .transition()

        .duration(150)

        .attr(

            "r",

            STAR.radius

        )

        .attr(

            "opacity",

            STAR.opacity

        );

    tooltip

        .style(

            "opacity",

            0

        );

}

function nodeClick(event,d){

    focusPerson(d);

}

//
// ------------------------------------------------------------
// AMBIENT MOTION
// ------------------------------------------------------------
//

let universeAngle = 0;

function startAmbientMotion(){

    d3.timer(

        elapsed=>{

            if(!rootGroup)

                return;

            universeAngle += 0.000015;

            rootGroup.attr(

                "transform",

                cameraTransform()

            );

        }

    );

}

function cameraTransform(){

    const scale =

        focusedPerson

        ?

        1.45

        :

        1;

    const rotate =

        universeAngle*180/Math.PI;

    return `translate(${CAMERA.x},${CAMERA.y}) scale(${scale}) rotate(${rotate},${width/2},${height/2})`;

}

//
// ------------------------------------------------------------
// CAMERA UPDATE
// ------------------------------------------------------------
//

function flyCameraTo(person){

    focusedPerson = person.id;

    d3.transition()

        .duration(1800)

        .ease(d3.easeCubicInOut)

        .tween(

            "camera",

            ()=>{

                const ix=d3.interpolate(

                    CAMERA.x,

                    width/2-person.x

                );

                const iy=d3.interpolate(

                    CAMERA.y,

                    height/2-person.y

                );

                return t=>{

                    CAMERA.x=ix(t);

                    CAMERA.y=iy(t);

                };

            }

        );

}

//
// ------------------------------------------------------------
// ESC KEY
// ------------------------------------------------------------
//

document.addEventListener(

    "keydown",

    event=>{

        if(

            event.key==="Escape"

        ){

            resetUniverse();

        }

    }

);

//
// ------------------------------------------------------------
// RESET
// ------------------------------------------------------------
//

function resetUniverse(){

    focusedPerson=null;

    CAMERA.x=0;

    CAMERA.y=0;

    nodeSelection

        .transition()

        .duration(500)

        .attr("r",STAR.radius)

        .attr("opacity",STAR.opacity);

    labelSelection

        .transition()

        .style("opacity",0);

    linkSelection

        .transition()

        .style("opacity",0.06);

}

//
// ------------------------------------------------------------
// END
// ------------------------------------------------------------
//

console.log(

    "Universe Mode 2 loaded."

);
