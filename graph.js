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

const SEARCH_PROMPTS = [

    "Relate yourself",

    "Find your relation"

];

const SEARCH_PULSE_DURATION = 2800;


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

const FAMILY_LAYOUT = {

    zoom: 1.65,

    parentY: -160,

    spouseX: 220,

    childY: 190,

    spacing: 180

};


const App = {

    state: "BOOT",

    universeReady: false,

    introComplete: false,

    universeVisible: false,

    searchEnabled: false,

    searchStarted: false,

    transitionRunning: false,

    cameraEnabled: false,

    animationStarted: false

};

function setState(nextState) {

    App.state = nextState;

    console.log("[Universe]", nextState);

}


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

let familyLayoutTargets = new Map();

let zoomBehavior;

let userView = d3.zoomIdentity;

let width = window.innerWidth;

let height = window.innerHeight;

let graph = null;

let nodeSelection;

let linkSelection;

let labelSelection;

let focusedPerson = null;


//
// ------------------------------------------------------------
// STARTUP
// ------------------------------------------------------------
//

document.addEventListener(

    "DOMContentLoaded",

    () => {

        setState("BOOT");

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

    zoomBehavior = d3
        .zoom()
        .scaleExtent([0.55, 4.5])
        .on(

            "zoom",

            event => {

                userView = event.transform;

            }

        );

    svg.call(zoomBehavior);

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

    App.universeReady = true;

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

            App.universeVisible = true;
            App.introComplete = true;
            App.searchEnabled = true;

            setState("READY");

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

    startSearchPromptRotation(input);

    input.addEventListener(

        "pointerdown",

        () => {

            if (
                !App.searchStarted
                ||
                !focusedPerson
            )
                return;

            const selected =

                graph.nodes.find(

                    person =>

                        String(person.id)
                        ===
                        String(focusedPerson)

                );

            if (!selected)
                return;

            const selectedName =

                selected.name
                ||
                selected.display_name
                ||
                "";

            if (
                input.value.trim()
                !==
                selectedName.trim()
            )
                return;

            input.value = "";

        }

    );

    input.addEventListener(

        "keydown",
        event => {

            if (
                event.key !== "Enter"
            )
                return;

            if (
                !App.searchEnabled
                ||
                !graph
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

            if (!App.searchStarted) {

                beginExploration(person);

                return;

            }

            focusPerson(person);

        }

    );

}

function startSearchPromptRotation(input) {

    let promptIndex = 0;

    setTimeout(

        () => {

            setInterval(

                () => {

                    promptIndex =

                        (
                            promptIndex
                            +
                            1
                        )
                        %
                        SEARCH_PROMPTS.length;

                    input.placeholder =

                        SEARCH_PROMPTS[promptIndex];

                },

                SEARCH_PULSE_DURATION

            );

        },

        4000

    );

}

function beginExploration(person) {

    App.searchStarted = true;
    App.transitionRunning = true;
    App.cameraEnabled = true;

    setState("TRANSITION");

    document.body.classList.add(

        "universe-active"

    );

    focusPerson(person);

    setTimeout(

        () => {

            App.transitionRunning = false;

            setState("EXPLORE");

        },

        2000

    );

}

//
// ------------------------------------------------------------
// FOCUS PERSON
// ------------------------------------------------------------
//

function focusPerson(person) {

    focusedPerson = person.id;

    const input =

        document.getElementById(

            "relation-input"

        );

    if (input) {

        input.value =

            person.name
            ||
            person.display_name
            ||
            "";

    }

    userView = d3.zoomIdentity;

    svg.call(

        zoomBehavior.transform,

        d3.zoomIdentity

    );

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

                n => String(n.id)

            )

        );

    const separation =

        calculateSeparation(

            id,

            keep

        );

    applyImmediateFamilyLayout(id);

    nodeSelection

        .transition()

        .duration(800)

        .attr(

            "r",

            d =>

                nodeSizeForSeparation(

                    separation.get(String(d.id)),

                    String(d.id)

                )


        )

        .attr(

            "opacity",

            d =>

                keep.has(String(d.id))

                ? 1

                : .12

        );

    linkSelection

        .transition()

        .duration(800)

        .style(

            "opacity",

            d =>

                keep.has(String(d.source.id))

                &&

                keep.has(String(d.target.id))

                ? .35

                : .02

        );

    labelSelection

        .text(

            d =>

                String(d.id) === String(id)

                ?

                (
                    d.name
                    ||
                    d.display_name
                )

                :

                (
                    d.display_name
                    ||
                    d.name
                )

        )

        .transition()

        .duration(600)

        .style(

            "font-size",

            d =>

                `${labelSizeForSeparation(

                    separation.get(String(d.id))

                )}px`

        )

        .style(

            "opacity",

            d =>

                shouldDisplayLabel(

                    separation.get(String(d.id))

                )

                ? 1

                : 0

        );

}

function calculateSeparation(startId, keep) {

    const normalizedStartId = String(startId);

    const distance = new Map([

        [normalizedStartId, 0]

    ]);

    const neighbours = new Map();

    graph.links.forEach(link => {

        const source =

            String(

                link.source.id
                ??
                link.source

            );

        const target =

            String(

                link.target.id
                ??
                link.target

            );

        if (
            !keep.has(source)
            ||
            !keep.has(target)
        )
            return;

        if (!neighbours.has(source))
            neighbours.set(source, []);

        if (!neighbours.has(target))
            neighbours.set(target, []);

        neighbours.get(source).push(target);
        neighbours.get(target).push(source);

    });

    const queue = [normalizedStartId];

    while (queue.length) {

        const current = queue.shift();

        for (
            const next
            of
            neighbours.get(current) || []
        ) {

            if (distance.has(next))
                continue;

            distance.set(

                next,

                distance.get(current) + 1

            );

            queue.push(next);

        }

    }

    return distance;

}

function labelSizeForSeparation(separation) {

    if (separation === 0)
        return 16;

    if (separation === 1)
        return 13;

    if (separation === 2)
        return 11;

    return 9;

}

function nodeSizeForSeparation(separation, id) {

    if (separation === 0)
        return 8;

    if (familyLayoutTargets.has(id))
        return 6;

    if (separation === 2)
        return 4;

    return STAR.radius;

}

function shouldDisplayLabel(separation) {

    return (

        Number.isFinite(separation)
        &&
        separation <= 3

    );

}

function applyImmediateFamilyLayout(id) {

    const selectedId = String(id);

    const selected =

        graph.nodes.find(

            node => String(node.id) === selectedId

        );

    if (!selected)
        return;

    const parents = [];
    const siblings = [];
    const spouses = [];
    const children = [];

    graph.links.forEach(link => {

        const source = String(

            link.source.id
            ??
            link.source

        );

        const target = String(

            link.target.id
            ??
            link.target

        );

        if (link.type === "spouse") {

            if (source === selectedId)
                spouses.push(target);

            else if (target === selectedId)
                spouses.push(source);

            return;

        }

        if (link.type !== "parent")
            return;

        if (target === selectedId)
            parents.push(source);

        if (source === selectedId)
            children.push(target);

    });

    const parentIds = new Set(parents);

    graph.links.forEach(link => {

        if (link.type !== "parent")
            return;

        const source = String(

            link.source.id
            ??
            link.source

        );

        const target = String(

            link.target.id
            ??
            link.target

        );

        if (
            parentIds.has(source)
            &&
            target !== selectedId
        )
            siblings.push(target);

    });

    familyLayoutTargets = new Map([

        [
            selectedId,
            {
                x: selected.x,
                y: selected.y
            }
        ]

    ]);

    arrangeFamilyRow(

        parents,

        selected.x,

        selected.y + FAMILY_LAYOUT.parentY

    );

    [...new Set(spouses)].forEach((spouseId, index) => {

        familyLayoutTargets.set(

            spouseId,

            {
                x:
                    selected.x
                    +
                    FAMILY_LAYOUT.spouseX
                    *
                    (index + 1),

                y: selected.y
            }

        );

    });

    [...new Set(siblings)].forEach((siblingId, index) => {

        familyLayoutTargets.set(

            siblingId,

            {
                x:
                    selected.x
                    -
                    FAMILY_LAYOUT.spouseX
                    *
                    (index + 1),

                y: selected.y
            }

        );

    });

    arrangeFamilyRow(

        children,

        selected.x,

        selected.y + FAMILY_LAYOUT.childY

    );

    simulation

        .force(

            "family-x",

            d3.forceX(

                node => {

                    const target =

                        familyLayoutTargets.get(

                            String(node.id)

                        );

                    return target
                        ?
                        target.x
                        :
                        node.x;

                }

            )

            .strength(

                node =>

                    familyLayoutTargets.has(

                        String(node.id)

                    )

                    ?
                    .55
                    :
                    0

            )

        )

        .force(

            "family-y",

            d3.forceY(

                node => {

                    const target =

                        familyLayoutTargets.get(

                            String(node.id)

                        );

                    return target
                        ?
                        target.y
                        :
                        node.y;

                }

            )

            .strength(

                node =>

                    familyLayoutTargets.has(

                        String(node.id)

                    )

                    ?
                    .55
                    :
                    0

            )

        )

        .force(

            "collision",

            d3.forceCollide()

                .radius(

                    node =>

                        familyLayoutTargets.has(

                            String(node.id)

                        )

                        ?
                        focusedLabelRadius(node)
                        :
                        8

                )

        )

        .alpha(.7)

        .restart();

}

function arrangeFamilyRow(ids, centerX, y) {

    const uniqueIds = [...new Set(ids)];

    const spacing =

        uniqueIds.length > 1

        ?

        FAMILY_LAYOUT.spacing

        :

        0;

    const startX =

        centerX
        -
        (
            spacing
            *
            (uniqueIds.length - 1)
            /
            2
        );

    uniqueIds.forEach((personId, index) => {

        familyLayoutTargets.set(

            personId,

            {
                x: startX + spacing * index,
                y
            }

        );

    });

}

function focusedLabelRadius(node) {

    const name =

        String(node.id) === String(focusedPerson)

        ?

        (
            node.name
            ||
            node.display_name
            ||
            ""
        )

        :

        (
            node.display_name
            ||
            node.name
            ||
            ""
        );

    return Math.max(

        42,

        Math.min(

            220,

            name.length * 4.5

        )

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

    const relationshipPath =

        focusedPerson

        ?

        findRelationshipPath(

            focusedPerson,

            d.id

        )

        :

        null;

    tooltip

        .html("")

        .style("opacity",1)

        .style(

            "left",

            (event.pageX+18)+"px"

        )

        .style(

            "top",

            (event.pageY-10)+"px"

        );

    tooltip

        .append("strong")

        .text(

            d.name
            ||
            d.display_name
            ||
            ""

        );

    const nicknames = personNicknames(d);

    if (nicknames.length) {

        tooltip

            .append("div")

            .style("margin-top","4px")

            .style("font-style","italic")

            .text(

                "Nickname"
                +
                (
                    nicknames.length > 1
                    ?
                    "s"
                    :
                    ""
                )
                +
                ": "
                +
                nicknames

                    .map(name => `“${name}”`)

                    .join(", ")

            );

    }

    if (relationshipPath) {

        tooltip

            .append("div")

            .style("margin-top","6px")

            .text(

                "Relationship: "
                +
                relationshipLabel(

                    relationshipPath.relationships

                )

            );

        tooltip

            .append("div")

            .style("margin-top","4px")

            .style("opacity",.78)

            .text(

                "Path from focus: "
                +
                relationshipPath.nodes

                    .map(personId =>

                        personName(personId)

                    )

                    .join(" → ")

            );

    }

}

function personNicknames(person) {

    const candidates = [

        person.nickname,

        person.nick_name,

        person.nicknames,

        person.call_name,

        person.preferred_name,

        person.aliases

    ];

    return [

        ...new Set(

            candidates

                .flatMap(value =>

                    Array.isArray(value)
                    ?
                    value
                    :
                    [value]

                )

                .filter(value =>

                    typeof value === "string"
                    &&
                    value.trim()

                )

                .map(value => value.trim())

        )

    ];

}

function findRelationshipPath(startId, endId) {

    const start = String(startId);
    const end = String(endId);

    if (start === end) {

        return {

            nodes: [start],

            relationships: []

        };

    }

    const neighbours = new Map();

    graph.links.forEach(link => {

        const source = String(

            link.source.id
            ??
            link.source

        );

        const target = String(

            link.target.id
            ??
            link.target

        );

        if (!neighbours.has(source))
            neighbours.set(source, []);

        if (!neighbours.has(target))
            neighbours.set(target, []);

        if (link.type === "spouse") {

            neighbours.get(source).push({

                id: target,

                relationship: "spouse"

            });

            neighbours.get(target).push({

                id: source,

                relationship: "spouse"

            });

            return;

        }

        neighbours.get(source).push({

            id: target,

            relationship: "child"

        });

        neighbours.get(target).push({

            id: source,

            relationship: "parent"

        });

    });

    const queue = [{

        id: start,

        nodes: [start],

        relationships: []

    }];

    const visited = new Set([start]);

    while (queue.length) {

        const current = queue.shift();

        for (
            const next
            of
            neighbours.get(current.id) || []
        ) {

            if (visited.has(next.id))
                continue;

            const path = {

                id: next.id,

                nodes: [

                    ...current.nodes,

                    next.id

                ],

                relationships: [

                    ...current.relationships,

                    next.relationship

                ]

            };

            if (next.id === end)
                return path;

            visited.add(next.id);

            queue.push(path);

        }

    }

    return null;

}

function relationshipLabel(relationships) {

    const signature = relationships.join(">");

    const labels = {

        "": "Person in focus",

        "parent": "Parent",

        "child": "Child",

        "spouse": "Spouse",

        "parent>child": "Sibling",

        "parent>parent": "Grandparent",

        "child>child": "Grandchild",

        "parent>parent>child": "Aunt or uncle",

        "parent>child>child": "Niece or nephew",

        "parent>parent>child>child": "Cousin"

    };

    return (

        labels[signature]
        ||
        `${relationships.length} degrees away`

    );

}

function personName(id) {

    const person =

        graph.nodes.find(

            node => String(node.id) === String(id)

        );

    if (!person)
        return "Unknown";

    return (

        person.display_name
        ||
        person.name
        ||
        "Unknown"

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

            keepLabelsHorizontal();

        }

    );

}

function keepLabelsHorizontal() {

    if (!labelSelection)
        return;

    const counterRotation =

        -universeAngle
        *
        180
        /
        Math.PI;

    labelSelection.attr(

        "transform",

        d =>

            `rotate(${counterRotation},${d.x},${d.y - 12})`

    );

}

function cameraTransform(){

    const person =

        focusedPerson
        &&
        graph

        ?

        graph.nodes.find(

            node => node.id === focusedPerson

        )

        :

        null;

    const scale =

        person

        ?

        FAMILY_LAYOUT.zoom

        :

        1;

    const rotate =

        universeAngle*180/Math.PI;

    if (person) {

        return `${userView} translate(${CAMERA.x},${CAMERA.y}) translate(${person.x},${person.y}) scale(${scale}) rotate(${rotate}) translate(${-person.x},${-person.y})`;

    }

    return `${userView} translate(${CAMERA.x},${CAMERA.y}) scale(${scale}) rotate(${rotate},${width/2},${height/2})`;

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

    familyLayoutTargets.clear();

    simulation

        .force("family-x", null)

        .force("family-y", null)

        .force(

            "collision",

            d3.forceCollide()

                .radius(8)

        )

        .alpha(.3)

        .restart();

    userView=d3.zoomIdentity;

    svg.call(

        zoomBehavior.transform,

        d3.zoomIdentity

    );

    CAMERA.x=0;

    CAMERA.y=0;

    nodeSelection

        .transition()

        .duration(500)

        .attr("r",STAR.radius)

        .attr("opacity",STAR.opacity);

    labelSelection

        .text(

            d =>

                d.display_name
                ||
                d.name

        )

        .transition()

        .style("font-size","12px")

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
