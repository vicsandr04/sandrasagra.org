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

const SEARCH_PULSE_DURATION = 4900;


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

    zoom: .9,

    parentY: -190,

    spouseX: 250,

    childY: 220,

    spacing: 220,

    chartRowGap: 190,

    chartColumnGap: 150

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

let focusedRelationshipLabels = new Map();

let focusedNodeSizes = new Map();

let relationshipTraceTerminals = new Set();

let relationshipTraceTerminalSize = 0;

let tooltipPersonId = null;


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

        setupNavigationGuide();

    }

);

function setupNavigationGuide() {

    const toggle =
        document.getElementById(
            "navigation-toggle"
        );

    const guide =
        document.getElementById(
            "navigation-guide"
        );

    const backdrop =
        document.getElementById(
            "navigation-backdrop"
        );

    const close =
        document.getElementById(
            "navigation-close"
        );

    if (
        !toggle
        ||
        !guide
        ||
        !backdrop
        ||
        !close
    )
        return;

    const openGuide = () => {

        hideRelationshipMenu();
        hideTooltip();

        guide.hidden = false;
        backdrop.hidden = false;

        toggle.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add(
            "navigation-open"
        );

        close.focus();

    };

    const closeGuide = () => {

        guide.hidden = true;
        backdrop.hidden = true;

        toggle.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "navigation-open"
        );

        toggle.focus();

    };

    toggle.addEventListener(
        "click",
        openGuide
    );

    close.addEventListener(
        "click",
        closeGuide
    );

    backdrop.addEventListener(
        "click",
        closeGuide
    );

}

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

    svg.on(

        "click.touch-tooltip",

        () => {

            if (isTouchDevice())
                hideTooltip();

        }

    );

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

    if (focusedPerson) {

        applyThreeDegreeFamilyLayout(focusedPerson);

        const selected =

            graph.nodes.find(

                node =>
                    String(node.id)
                    ===
                    String(focusedPerson)

            );

        if (selected)
            flyCameraTo(selected);

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

        0.12

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

    d3.selectAll(

        ".labels text"

    )

    .style(

        "opacity",

        0

    )

    .transition()

    .duration(

        2800

    )

    .style(

        "opacity",

        .62

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

        .attr("r", baseNodeRadius())

        .attr("fill", "white")

        .attr("opacity", STAR.opacity)

        .style("filter","drop-shadow(0 0 4px rgba(255,255,255,.65))")

        .call(enableDragging())

        .on("mouseover", nodeHover)

        .on("mouseout", nodeOut)

        .on("click", nodeClick)

        .on("dblclick", nodeDoubleClick)

        .on("contextmenu", nodeContextMenu)

        .on("pointerdown.longpress", nodeLongPressStart)

        .on("pointermove.longpress", nodeLongPressMove)

        .on(

            "pointerup.longpress pointercancel.longpress",

            cancelNodeLongPress

        );

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

        .attr(

            "font-size",

            `${globalLabelSize()}px`

        )

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

                    .strength(-85)

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

                    .radius(nodeLabelCollisionRadius)

                    .iterations(2)

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

            return 55;

        case "parent":

            return 75;

        default:

            return 95;

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

    const suggestions = document.getElementById(
        "relation-suggestions"
    );

    if (
        !input
        ||
        !suggestions
    )
        return;

    let suggestionMatches = [];
    let activeSuggestionIndex = -1;

    const hideSuggestions = () => {

        suggestionMatches = [];
        activeSuggestionIndex = -1;
        suggestions.replaceChildren();
        suggestions.hidden = true;

        input.setAttribute("aria-expanded","false");
        input.removeAttribute("aria-activedescendant");

    };

    const selectSuggestion = person => {

        const fullName =

            person.name
            ||
            person.display_name
            ||
            "";

        const separatorIndex =
            input.value.lastIndexOf("/");

        if (separatorIndex === -1) {

            input.value = fullName;

        } else {

            const firstValue =
                input.value
                    .slice(0, separatorIndex)
                    .trim();

            input.value =

                (
                    firstValue
                    ?
                    `${firstValue} / `
                    :
                    "/ "
                )

                +
                fullName;

        }

        resizeRelationInput(input);

        hideSuggestions();

    };

    const setActiveSuggestion = index => {

        if (!suggestionMatches.length)
            return;

        activeSuggestionIndex =

            (
                index
                +
                suggestionMatches.length
            )

            %
            suggestionMatches.length;

        suggestions

            .querySelectorAll(".relation-suggestion")

            .forEach(

                (button,buttonIndex) => {

                    const isActive =
                        buttonIndex === activeSuggestionIndex;

                    button.classList.toggle(
                        "is-active",
                        isActive
                    );

                    button.setAttribute(
                        "aria-selected",
                        String(isActive)
                    );

                    if (isActive) {

                        input.setAttribute(
                            "aria-activedescendant",
                            button.id
                        );

                        button.scrollIntoView({
                            block: "nearest",
                            inline: "nearest"
                        });

                    }

                }

            );

    };

    const showSuggestions = () => {

        const separatorIndex =
            input.value.lastIndexOf("/");

        const searchValue =

            input.value
                .slice(separatorIndex + 1)
                .trim();

        if (
            !App.searchEnabled
            ||
            !graph
            ||
            searchValue.length < 5
        ) {

            hideSuggestions();

            return;

        }

        suggestionMatches =
            findPeopleByName(searchValue,6);

        activeSuggestionIndex = -1;
        suggestions.replaceChildren();

        if (!suggestionMatches.length) {

            hideSuggestions();

            return;

        }

        suggestionMatches.forEach(

            (person,index) => {

                const button =
                    document.createElement("button");

                button.id =
                    `relation-suggestion-${index}`;

                button.type = "button";
                button.className = "relation-suggestion";
                button.setAttribute("role","option");
                button.setAttribute("aria-selected","false");

                button.textContent =

                    person.name
                    ||
                    person.display_name
                    ||
                    "";

                const formalNameMatches =

                    [
                        person.name,
                        person.display_name
                    ]

                        .filter(Boolean)

                        .some(

                            name =>
                                name
                                    .toLowerCase()
                                    .includes(
                                        searchValue.toLowerCase()
                                    )

                        );

                if (!formalNameMatches) {

                    const matchedAlternateName =

                        personSearchNames(person)

                            .find(

                                name =>
                                    name
                                        .toLowerCase()
                                        .includes(
                                            searchValue.toLowerCase()
                                        )

                            );

                    if (matchedAlternateName)
                        button.textContent +=
                            ` — ${matchedAlternateName}`;

                }

                button.addEventListener(

                    "pointerdown",

                    event => {

                        event.preventDefault();
                        selectSuggestion(person);
                        input.focus();

                    }

                );

                suggestions.appendChild(button);

            }

        );

        suggestions.hidden = false;
        input.setAttribute("aria-expanded","true");

    };

    startSearchPromptRotation(input);

    const clearSearchField = () => {

        input.value = "";

        input.placeholder = "";

        resizeRelationInput(input);

        hideSuggestions();

    };

    input.addEventListener(

        "click",

        clearSearchField

    );

    input.addEventListener(

        "input",

        () => {

            resizeRelationInput(input);
            showSuggestions();

        }

    );

    input.addEventListener(

        "focus",

        showSuggestions

    );

    input.addEventListener(

        "blur",

        () => {

            if (!input.value)
                input.placeholder = SEARCH_PROMPTS[0];

            setTimeout(hideSuggestions,120);

        }

    );

    input.addEventListener(

        "keydown",
        async event => {

            if (
                event.key === "/"
                &&
                !input.value.trim()
                &&
                focusedPerson
            ) {

                event.preventDefault();

                input.value =
                    `${personName(focusedPerson)} / `;

                resizeRelationInput(input);
                hideSuggestions();

                return;

            }

            if (
                event.key === "ArrowDown"
                ||
                event.key === "ArrowUp"
            ) {

                event.preventDefault();

                if (suggestions.hidden)
                    showSuggestions();

                setActiveSuggestion(

                    activeSuggestionIndex
                    +
                    (
                        event.key === "ArrowDown"
                        ?
                        1
                        :
                        -1
                    )

                );

                return;

            }

            if (event.key === "Escape") {

                hideSuggestions();

                return;

            }

            if (
                event.key !== "Enter"
            )
                return;

            if (
                activeSuggestionIndex >= 0
                &&
                suggestionMatches[
                    activeSuggestionIndex
                ]
            )
                selectSuggestion(
                    suggestionMatches[
                        activeSuggestionIndex
                    ]
                );

            hideSuggestions();

            if (
                !App.searchEnabled
                ||
                !graph
            )
                return;

            const value =
                input.value.trim();

            if (!value)
                return;

            const separatorIndex =
                value.indexOf("/");

            if (separatorIndex !== -1) {

                event.preventDefault();

                const firstValue =
                    value.slice(0, separatorIndex).trim();

                const secondValue =
                    value.slice(separatorIndex + 1).trim();

                const firstPerson =

                    firstValue

                    ?

                    findPersonByName(firstValue)

                    :

                    graph.nodes.find(

                        person =>
                            String(person.id)
                            ===
                            String(focusedPerson)

                    );

                const secondPerson =
                    findPersonByName(secondValue);

                if (
                    !firstPerson
                    ||
                    !secondPerson
                )
                    return;

                try {

                    if (!App.searchStarted)
                        await beginExploration(firstPerson);
                    else
                        await focusPerson(firstPerson);

                } catch (error) {

                    console.error(
                        "Unable to load the focused family",
                        error
                    );

                }

                if (
                    String(focusedPerson)
                    !==
                    String(firstPerson.id)
                )
                    return;

                traceRelationshipToFocus(secondPerson);

                input.value =
                    `${personName(firstPerson.id)} / ${personName(secondPerson.id)}`;

                resizeRelationInput(input);

                return;

            }

            const person =
                findPersonByName(value);

            if (!person)
                return;

            if (!App.searchStarted) {

                beginExploration(person);

                return;

            }

            focusPerson(person);

        }

    );

    window.addEventListener(

        "resize",

        () => resizeRelationInput(input)

    );

}

function resizeRelationInput(input) {

    if (!input)
        return;

    input.style.removeProperty("width");

    const style = window.getComputedStyle(input);
    const baseWidth = parseFloat(style.width) || 0;

    if (!input.value) {

        input.style.width = `${baseWidth}px`;

        return;

    }

    const canvas =

        resizeRelationInput.canvas
        ||
        (
            resizeRelationInput.canvas =
                document.createElement("canvas")
        );

    const context = canvas.getContext("2d");

    if (!context)
        return;

    context.font = style.font;

    const letterSpacing =
        parseFloat(style.letterSpacing) || 0;

    const textWidth =

        context.measureText(input.value).width

        +

        Math.max(
            0,
            input.value.length - 1
        )

        *

        letterSpacing;

    const horizontalChrome =

        parseFloat(style.paddingLeft)
        +
        parseFloat(style.paddingRight)
        +
        parseFloat(style.borderLeftWidth)
        +
        parseFloat(style.borderRightWidth);

    const comfortSpace = 28;

    const desiredWidth =

        style.boxSizing === "border-box"

        ?

        textWidth
        +
        horizontalChrome
        +
        comfortSpace

        :

        textWidth
        +
        comfortSpace;

    const maximumWidth =

        style.boxSizing === "border-box"

        ?

        window.innerWidth - 32

        :

        window.innerWidth
        -
        32
        -
        horizontalChrome;

    input.style.width =

        `${Math.max(

            0,

            Math.min(

                maximumWidth,

                Math.max(
                    baseWidth,
                    desiredWidth
                )

            )

        )}px`;

}

function findPersonByName(value) {

    return findPeopleByName(value,1)[0] || null;

}

function findPeopleByName(value,limit = 6) {

    const searchValue =
        String(value || "").trim().toLowerCase();

    if (!searchValue)
        return [];

    return graph.nodes

        .filter(

            person =>

                personSearchNames(person)

                    .some(

                        name =>
                            name
                                .toLowerCase()
                                .includes(searchValue)

                    )

        )

        .sort(

            (first,second) => {

                const firstName =
                    (
                        first.name
                        ||
                        first.display_name
                        ||
                        ""
                    ).toLowerCase();

                const secondName =
                    (
                        second.name
                        ||
                        second.display_name
                        ||
                        ""
                    ).toLowerCase();

                const firstStarts =
                    firstName.startsWith(searchValue);

                const secondStarts =
                    secondName.startsWith(searchValue);

                if (firstStarts !== secondStarts)
                    return firstStarts ? -1 : 1;

                return firstName.localeCompare(secondName);

            }

        )

        .slice(0,limit);

}

function personSearchNames(person) {

    return [

        person.name,
        person.display_name,

        ...(
            Array.isArray(person.nicknames)
            ?
            person.nicknames
            :
            []
        ),

        ...(
            Array.isArray(person.alternate_names)
            ?
            person.alternate_names
            :
            []
        ),

        ...(
            Array.isArray(person.search_names)
            ?
            person.search_names
            :
            []
        )

    ]

        .filter(

            value =>
                typeof value === "string"
                &&
                value.trim()

        );

}

function startSearchPromptRotation(input) {

    let promptIndex = 0;

    setTimeout(

        () => {

            setInterval(

                () => {

                    if (
                        document.activeElement
                        ===
                        input
                    )
                        return;

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

    const familyReady = focusPerson(person);

    setTimeout(

        () => {

            App.transitionRunning = false;

            setState("EXPLORE");

        },

        2000

    );

    return familyReady;

}

//
// ------------------------------------------------------------
// FOCUS PERSON
// ------------------------------------------------------------
//

function focusPerson(person) {

    clearRelationshipTrace();

    focusedRelationshipLabels.clear();

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

        resizeRelationInput(input);

    }

    userView = d3.zoomIdentity;

    svg.call(

        zoomBehavior.transform,

        d3.zoomIdentity

    );

    flyCameraTo(person);

    return illuminateFamily(person.id);

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

    if (
        String(id)
        !==
        String(focusedPerson)
    )
        return;

    focusedRelationshipLabels =

        new Map(

            family.nodes.map(node => [

                String(node.id),

                node.relationship

            ])

        );

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

    const labelSeparation =

        coupleLabelSeparations(separation);

    focusedNodeSizes =

        new Map(

            graph.nodes.map(node => [

                String(node.id),

                nodeSizeForSeparation(
                    separation.get(String(node.id)),
                    String(node.id)
                )

            ])

        );

    if (relationshipTraceTerminals.size)
        relationshipTraceTerminalSize =

            Math.max(

                ...[
                    ...relationshipTraceTerminals
                ].map(

                    personId =>

                        focusedNodeSizes.get(personId)
                        ??
                        baseNodeRadius()

                )

            );

    const chartPeople =

        new Set(

            [...separation]

                .filter(

                    ([, distance]) =>
                        distance <= 3

                )

                .map(([personId]) => personId)

        );

    applyThreeDegreeFamilyLayout(

        id,

        chartPeople

    );

    nodeSelection

        .transition()

        .duration(800)

        .attr(

            "r",

            d =>

                relationshipTraceTerminals.has(
                    String(d.id)
                )

                ?

                relationshipTraceTerminalSize

                :

                (
                    focusedNodeSizes.get(String(d.id))
                    ??
                    baseNodeRadius()
                )


        )

        .attr(

            "opacity",

            d =>

                chartPeople.has(String(d.id))

                ? 1

                : .12

        );

    linkSelection

        .transition()

        .duration(800)

        .style(

            "opacity",

            d =>

                chartPeople.has(String(d.source.id))

                &&

                chartPeople.has(String(d.target.id))

                ? .5

                : .035

        );

    labelSelection

        .text(

            d =>

                isFocusedCoupleMember(d.id)

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

                    labelSeparation.get(

                        String(d.id)

                    )

                )}px`

        )

        .style(

            "opacity",

            d =>

                (
                    separation.get(String(d.id))
                    <=
                    3
                )

                ? 1

                : .32

        );

}

function coupleLabelSeparations(separation) {

    const result = new Map(separation);

    graph.links.forEach(link => {

        if (link.type !== "spouse")
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

        const sharedSeparation = Math.min(

            result.get(source)
            ??
            Infinity,

            result.get(target)
            ??
            Infinity

        );

        if (!Number.isFinite(sharedSeparation))
            return;

        result.set(source, sharedSeparation);
        result.set(target, sharedSeparation);

    });

    return result;

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

    const sizeScale =

        width <= 600
        ?
        0.76
        :
        (
            width <= 1024
            ?
            0.86
            :
            1
        );

    if (separation === 0)
        return 16 * sizeScale;

    if (separation === 1)
        return 10.5 * sizeScale;

    if (separation === 2)
        return 8.5 * sizeScale;

    return 7 * sizeScale;

}

function nodeSizeForSeparation(separation, id) {

    if (
        separation === 0
        ||
        isFocusedCoupleMember(id)
    )
        return 8;

    if (familyLayoutTargets.has(id))
        return 6;

    if (separation === 2)
        return 4;

    return baseNodeRadius();

}

function applyThreeDegreeFamilyLayout(

    id,

    allowedIds = null

) {

    const selectedId = String(id);

    const selected =

        graph.nodes.find(

            node => String(node.id) === selectedId

        );

    if (!selected)
        return;

    const layout = familyLayoutForViewport();

    const chartPaths =

        calculateChartPaths(

            selectedId,

            allowedIds

        );

    const rows = new Map();

    chartPaths.forEach((path, personId) => {

        if (
            personId === selectedId
            ||
            path.distance > 3
        )
            return;

        const generation =

            Math.max(

                -3,

                Math.min(3, path.generation)

            );

        if (!rows.has(generation))
            rows.set(generation, []);

        rows.get(generation).push({

            id: personId,

            ...path

        });

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

    rows.forEach((people, generation) => {

        people.sort(chartPersonOrder);

        if (generation === 0) {

            arrangeFocusGeneration(

                people,

                selected,

                layout

            );

            return;

        }

        arrangeChartRow(

            people.map(person => person.id),

            selected.x,

            selected.y
            +
            generation
            *
            layout.chartRowGap,

            layout.chartColumnGap

        );

    });

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
                    .82
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
                    .82
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
                        nodeLabelCollisionRadius(node)

                )

                .iterations(3)

        )

        .alpha(.85)

        .restart();

}

function calculateChartPaths(startId, allowedIds) {

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

        if (
            allowedIds
            &&
            (
                !allowedIds.has(source)
                ||
                !allowedIds.has(target)
            )
        )
            return;

        if (!neighbours.has(source))
            neighbours.set(source, []);

        if (!neighbours.has(target))
            neighbours.set(target, []);

        if (link.type === "spouse") {

            neighbours.get(source).push({
                id: target,
                relationship: "spouse",
                generation: 0
            });

            neighbours.get(target).push({
                id: source,
                relationship: "spouse",
                generation: 0
            });

            return;

        }

        if (link.type !== "parent")
            return;

        neighbours.get(source).push({
            id: target,
            relationship: "child",
            generation: 1
        });

        neighbours.get(target).push({
            id: source,
            relationship: "parent",
            generation: -1
        });

    });

    const paths = new Map([

        [
            startId,
            {
                distance: 0,
                generation: 0,
                relationships: []
            }
        ]

    ]);

    const queue = [startId];

    while (queue.length) {

        const currentId = queue.shift();
        const current = paths.get(currentId);

        if (current.distance >= 3)
            continue;

        for (
            const neighbour
            of
            neighbours.get(currentId) || []
        ) {

            if (paths.has(neighbour.id))
                continue;

            paths.set(

                neighbour.id,

                {
                    distance: current.distance + 1,
                    generation:
                        current.generation
                        +
                        neighbour.generation,
                    relationships: [
                        ...current.relationships,
                        neighbour.relationship
                    ]
                }

            );

            queue.push(neighbour.id);

        }

    }

    return paths;

}

function chartPersonOrder(a, b) {

    const relationshipOrder =

        a.relationships.join(">")

        .localeCompare(

            b.relationships.join(">")

        );

    if (relationshipOrder)
        return relationshipOrder;

    return personName(a.id)

        .localeCompare(personName(b.id));

}

function arrangeFocusGeneration(

    people,

    selected,

    layout

) {

    const selectedId = String(selected.id);

    const pathByPerson =

        new Map(

            people.map(person => [

                String(person.id),

                person.relationships.join(">")

            ])

        );

    const units = buildChartUnits([

        selectedId,

        ...people.map(person => person.id)

    ]);

    const focusUnit =

        units.find(unit =>
            unit.includes(selectedId)
        );

    if (focusUnit) {

        focusUnit.splice(
            focusUnit.indexOf(selectedId),
            1
        );

        focusUnit.unshift(selectedId);

    }

    const siblingUnits = units.filter(unit =>

        unit !== focusUnit
        &&
        unit.some(personId =>

            (
                pathByPerson.get(personId)
                ||
                ""
            ).startsWith("parent>child")

        )

    );

    const otherUnits = units.filter(unit =>

        unit !== focusUnit
        &&
        !siblingUnits.includes(unit)

    );

    arrangeChartUnits(

        [
            ...siblingUnits,
            ...(focusUnit ? [focusUnit] : []),
            ...otherUnits
        ],

        selected.x,

        selected.y,

        layout.chartColumnGap,

        selectedId

    );

}

function arrangeChartRow(

    ids,

    centerX,

    y,

    minimumGap

) {

    if (!ids.length)
        return;

    arrangeChartUnits(

        buildChartUnits(ids),

        centerX,

        y,

        minimumGap

    );

}

function buildChartUnits(ids) {

    const orderedIds =

        [...new Set(

            ids.map(id => String(id))

        )];

    const available = new Set(orderedIds);
    const assigned = new Set();
    const units = [];

    orderedIds.forEach(personId => {

        if (assigned.has(personId))
            return;

        const unit = [personId];

        assigned.add(personId);

        graph.links.forEach(link => {

            if (link.type !== "spouse")
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

            let spouseId = null;

            if (source === personId)
                spouseId = target;
            else if (target === personId)
                spouseId = source;

            if (
                !spouseId
                ||
                !available.has(spouseId)
                ||
                assigned.has(spouseId)
            )
                return;

            unit.push(spouseId);
            assigned.add(spouseId);

        });

        units.push(unit);

    });

    return units;

}

function arrangeChartUnits(

    units,

    centerX,

    y,

    minimumUnitGap,

    anchorId = null

) {

    if (!units.length)
        return;

    const couplePadding =

        width <= 600
        ?
        6
        :
        10;

    const layouts = units

        .map(unit => {

            const people = unit

                .map(personId =>

                    graph.nodes.find(node =>

                        String(node.id)
                        ===
                        String(personId)

                    )

                )

                .filter(Boolean);

            if (!people.length)
                return null;

            const centers = [0];

            for (
                let index = 1;
                index < people.length;
                index += 1
            ) {

                centers[index] =

                    centers[index - 1]
                    +
                    focusedLabelRadius(
                        people[index - 1]
                    )
                    +
                    focusedLabelRadius(
                        people[index]
                    )
                    +
                    couplePadding;

            }

            const left =

                centers[0]
                -
                focusedLabelRadius(people[0]);

            const right =

                centers[centers.length - 1]
                +
                focusedLabelRadius(
                    people[people.length - 1]
                );

            return {
                people,
                centers,
                left,
                width: right - left
            };

        })

        .filter(Boolean);

    const totalWidth =

        layouts.reduce(

            (sum, layout) =>
                sum + layout.width,

            0

        )
        +
        minimumUnitGap
        *
        Math.max(0, layouts.length - 1);

    let edge = centerX - totalWidth / 2;
    const placedIds = [];

    layouts.forEach(layout => {

        layout.people.forEach(

            (person, index) => {

                const personId = String(person.id);

                familyLayoutTargets.set(

                    personId,

                    {
                        x:
                            edge
                            -
                            layout.left
                            +
                            layout.centers[index],
                        y
                    }

                );

                placedIds.push(personId);

            }

        );

        edge +=
            layout.width
            +
            minimumUnitGap;

    });

    if (
        anchorId
        &&
        familyLayoutTargets.has(anchorId)
    ) {

        const shift =

            centerX
            -
            familyLayoutTargets.get(anchorId).x;

        placedIds.forEach(personId => {

            familyLayoutTargets
                .get(personId)
                .x += shift;

        });

    }

}

function applyImmediateFamilyLayout(id) {

    const selectedId = String(id);

    const selected =

        graph.nodes.find(

            node => String(node.id) === selectedId

        );

    if (!selected)
        return;

    const layout = familyLayoutForViewport();

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

        selected.y + layout.parentY,

        layout.spacing

    );

    [...new Set(spouses)].forEach((spouseId, index) => {

        familyLayoutTargets.set(

            spouseId,

            {
                x:
                    selected.x
                    +
                    layout.spouseX
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
                    layout.spouseX
                    *
                    (index + 1),

                y: selected.y
            }

        );

    });

    arrangeFamilyRow(

        children,

        selected.x,

        selected.y + layout.childY,

        layout.spacing

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
                        nodeLabelCollisionRadius(node)

                )

                .iterations(2)

        )

        .alpha(.7)

        .restart();

}

function arrangeFamilyRow(ids, centerX, y, rowSpacing) {

    const uniqueIds = [...new Set(ids)];

    const spacing =

        uniqueIds.length > 1

        ?

        rowSpacing

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

    const prominentCoupleMember =

        isFocusedCoupleMember(node.id);

    const name =

        prominentCoupleMember

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

    const characterWidth =

        width <= 600
        ?
        (
            prominentCoupleMember
            ?
            3
            :
            2.4
        )
        :
        (
            width <= 1024
            ?
            (
                prominentCoupleMember
                ?
                3.6
                :
                2.8
            )
            :
            (
                prominentCoupleMember
                ?
                4.2
                :
                3.2
            )
        );

    const maximumRadius =

        width <= 600
        ?
        (
            prominentCoupleMember
            ?
            115
            :
            90
        )
        :
        (
            width <= 1024
            ?
            (
                prominentCoupleMember
                ?
                145
                :
                120
            )
            :
            (
                prominentCoupleMember
                ?
                180
                :
                150
            )
        );

    return Math.max(

        24,

        Math.min(

            maximumRadius,

            name.length * characterWidth

        )

    );

}

function isFocusedCoupleMember(personId) {

    const normalizedPersonId = String(personId);
    const normalizedFocusId = String(focusedPerson);

    if (normalizedPersonId === normalizedFocusId)
        return true;

    return graph.links.some(link => {

        if (link.type !== "spouse")
            return false;

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

        return (
            (
                source === normalizedFocusId
                &&
                target === normalizedPersonId
            )
            ||
            (
                target === normalizedFocusId
                &&
                source === normalizedPersonId
            )
        );

    });

}

function globalLabelSize() {

    if (width <= 600)
        return 5.5;

    if (width <= 1024)
        return 6.25;

    return 7;

}

function nodeLabelCollisionRadius(node) {

    const name =

        String(

            node.display_name
            ||
            node.name
            ||
            ""

        );

    const estimatedHalfWidth =

        name.length
        *
        globalLabelSize()
        *
        .29;

    const maximumRadius =

        width <= 600
        ?
        72
        :
        (
            width <= 1024
            ?
            92
            :
            115
        );

    return Math.max(

        16,

        Math.min(

            maximumRadius,

            estimatedHalfWidth + 12

        )

    );

}

function familyLayoutForViewport() {

    if (width <= 600) {

        return {

            zoom: .68,

            parentY: -135,

            spouseX: 160,

            childY: 150,

            spacing: 145,

            chartRowGap: 125,

            chartColumnGap: 92

        };

    }

    if (width <= 1024) {

        return {

            zoom: .78,

            parentY: -165,

            spouseX: 205,

            childY: 185,

            spacing: 185,

            chartRowGap: 155,

            chartColumnGap: 120

        };

    }

    return FAMILY_LAYOUT;

}

function baseNodeRadius() {

    if (width <= 600)
        return 3.4;

    if (width <= 1024)
        return 2.8;

    return STAR.radius;

}

//
// ============================================================
// PART 4
// Hover • Tooltip • Animation • Finish
// ============================================================
//

let tooltip = null;
let relationshipMenu = null;
let relationshipMenuPerson = null;
let longPressTimer = null;
let longPressOrigin = null;
let suppressNextNodeClick = false;

createTooltip();
createRelationshipMenu();
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

function createRelationshipMenu() {

    relationshipMenu =

        document.createElement("div");

    relationshipMenu.id =
        "relationship-menu";

    relationshipMenu.setAttribute(

        "role",

        "menu"

    );

    const traceButton =

        document.createElement("button");

    traceButton.type = "button";
    traceButton.setAttribute("role","menuitem");

    traceButton.addEventListener(

        "click",

        event => {

            event.stopPropagation();

            if (
                relationshipMenuPerson
                &&
                focusedPerson
            )
                traceRelationshipToFocus(

                    relationshipMenuPerson

                );

            hideRelationshipMenu();

        }

    );

    relationshipMenu.appendChild(traceButton);
    document.body.appendChild(relationshipMenu);

    document.addEventListener(

        "pointerdown",

        event => {

            if (
                relationshipMenu
                &&
                !relationshipMenu.contains(
                    event.target
                )
            )
                hideRelationshipMenu();

        }

    );

}

//
// ------------------------------------------------------------
// NODE EVENTS
// ------------------------------------------------------------
//

function interactiveNodeRadius(person) {

    const personId = String(person.id);

    if (relationshipTraceTerminals.has(personId))
        return relationshipTraceTerminalSize;

    if (isFocusedCoupleMember(personId))
        return 8;

    return Math.max(

        6,

        focusedNodeSizes.get(personId)
        ??
        baseNodeRadius()

    );

}

function nodeHover(event,d){

    d3.select(this)

        .transition()

        .duration(150)

        .attr(

            "r",

            interactiveNodeRadius(d)

        )

        .attr("opacity",1);

    showNodeTooltip(event,d);

}

function showNodeTooltip(event,d) {

    tooltipPersonId = String(d.id);

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

        const relationship =

            focusedRelationshipLabels.get(

                String(d.id)

            );

        tooltip

            .append("div")

            .attr(

                "class",

                "tooltip-relationship"

            )

            .style("margin-top","6px")

            .text(

                "Relationship: "
                +
                displayRelationshipLabel(

                    relationship
                    ||
                    relationshipLabel(

                        relationshipPath.relationships

                    )

                )

            );

        if (
            focusedPerson
            &&
            !relationship
        )
            loadSpecificRelationship(

                focusedPerson,

                d.id

            );

        const pathLine = tooltip

            .append("div")

            .style("margin-top","4px")

            .attr("class","tooltip-path");

        pathLine.append("span")

            .text("Path from focus: ");

        const commonAncestorIndex =
            relationshipCommonAncestorIndex(
                relationshipPath
            );

        relationshipPath.nodes.forEach(

            (personId,index) => {

                if (index)
                    pathLine

                        .append("span")

                        .text(" → ");

                pathLine

                    .append("span")

                    .classed(
                        "tooltip-common-ancestor",
                        index === commonAncestorIndex
                    )

                    .text(personName(personId));

            }

        );

    }

}

async function loadSpecificRelationship(

    focusId,

    personId

) {

    const cacheKey =

        `${focusId}::${personId}`;

    if (
        focusedRelationshipLabels.has(

            String(personId)

        )
    )
        return;

    try {

        const response = await fetch(

            "/api/relationship/"
            +
            encodeURIComponent(focusId)
            +
            "/"
            +
            encodeURIComponent(personId)

        );

        if (!response.ok)
            return;

        const result = await response.json();

        if (
            String(focusedPerson)
            !==
            String(focusId)
        )
            return;

        focusedRelationshipLabels.set(

            String(personId),

            result.relationship

        );

        if (
            tooltipPersonId
            ===
            String(personId)
        )
            tooltip

            .select(".tooltip-relationship")

            .text(

                "Relationship: "
                +
                displayRelationshipLabel(

                    result.relationship

                )

            );

    }
    catch (error) {

        console.warn(

            "[Universe] Relationship lookup failed",

            cacheKey,

            error

        );

    }

}

function displayRelationshipLabel(value) {

    if (!value)
        return "Relative";

    return (

        value.charAt(0).toUpperCase()
        +
        value.slice(1)

    );

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

function relationshipCommonAncestorIndex(path) {

    const relationships = path.relationships;

    if (
        !relationships.length
        ||
        relationships.includes("spouse")
    )
        return -1;

    const firstChildIndex =
        relationships.indexOf("child");

    if (firstChildIndex === 0)
        return relationships.every(
            relationship =>
                relationship === "child"
        )
        ?
        0
        :
        -1;

    if (firstChildIndex === -1)
        return relationships.every(
            relationship =>
                relationship === "parent"
        )
        ?
        path.nodes.length - 1
        :
        -1;

    const ascendsToAncestor =

        relationships
            .slice(0, firstChildIndex)
            .every(
                relationship =>
                    relationship === "parent"
            );

    const descendsFromAncestor =

        relationships
            .slice(firstChildIndex)
            .every(
                relationship =>
                    relationship === "child"
            );

    return (
        ascendsToAncestor
        &&
        descendsFromAncestor
    )
    ?
    firstChildIndex
    :
    -1;

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

        person.name
        ||
        person.display_name
        ||
        "Unknown"

    );

}

function nodeOut(){

    if (isTouchDevice())
        return;

    nodeSelection

        .filter(

            d =>
                !isFocusedCoupleMember(d.id)

        )

        .transition()

        .duration(150)

        .attr(

            "r",

            d =>

                relationshipTraceTerminals.has(
                    String(d.id)
                )

                ?

                relationshipTraceTerminalSize

                :

                (
                    focusedNodeSizes.get(
                        String(d.id)
                    )

                    ??

                    baseNodeRadius()
                )

        )

        .attr(

            "opacity",

            STAR.opacity

        );

    hideTooltip();

}

function nodeClick(event,d){

    event.stopPropagation();

    if (suppressNextNodeClick) {

        suppressNextNodeClick = false;

        event.preventDefault();

        return;

    }

    if (isTouchDevice()) {

        d3.select(this)

            .interrupt()

            .attr(

                "r",

                interactiveNodeRadius(d)

            )

            .attr("opacity",1);

        showNodeTooltip(event,d);

        return;

    }

    if (!App.searchStarted) {

        beginExploration(d);

        return;

    }

    focusPerson(d);

}

function nodeDoubleClick(event,d) {

    if (!isTouchDevice())
        return;

    event.preventDefault();
    event.stopPropagation();

    if (!App.searchStarted)
        beginExploration(d);
    else
        focusPerson(d);

    d3.select(this)

        .interrupt()

        .attr("r",8)

        .attr("opacity",1);

    showNodeTooltip(event,d);

}

function nodeContextMenu(event,d) {

    event.preventDefault();
    event.stopPropagation();

    openRelationshipMenu(

        event,

        d

    );

}

function nodeLongPressStart(event,d) {

    if (
        event.pointerType === "mouse"
        ||
        !isTouchDevice()
    )
        return;

    cancelNodeLongPress();

    longPressOrigin = {
        x: event.clientX,
        y: event.clientY
    };

    const menuEvent = {
        clientX: event.clientX,
        clientY: event.clientY
    };

    longPressTimer = setTimeout(

        () => {

            suppressNextNodeClick = true;

            openRelationshipMenu(

                menuEvent,

                d

            );

            longPressTimer = null;

            setTimeout(

                () => {

                    suppressNextNodeClick = false;

                },

                1200

            );

        },

        650

    );

}

function nodeLongPressMove(event) {

    if (
        !longPressTimer
        ||
        !longPressOrigin
    )
        return;

    const movement =

        Math.hypot(

            event.clientX - longPressOrigin.x,

            event.clientY - longPressOrigin.y

        );

    if (movement > 12)
        cancelNodeLongPress();

}

function cancelNodeLongPress() {

    if (longPressTimer)
        clearTimeout(longPressTimer);

    longPressTimer = null;
    longPressOrigin = null;

}

function openRelationshipMenu(event,person) {

    if (!relationshipMenu)
        return;

    relationshipMenuPerson = person;

    const button =

        relationshipMenu.querySelector("button");

    button.disabled = !focusedPerson;

    button.textContent =

        focusedPerson
        ?
        `Trace relationship path to ${personName(
            focusedPerson
        )}`
        :
        "Select a person to focus first";

    relationshipMenu.classList.add("is-visible");

    const menuWidth = 310;
    const menuHeight = 72;

    relationshipMenu.style.left =

        `${Math.max(

            12,

            Math.min(

                event.clientX,

                window.innerWidth
                -
                menuWidth
                -
                12

            )

        )}px`;

    relationshipMenu.style.top =

        `${Math.max(

            12,

            Math.min(

                event.clientY,

                window.innerHeight
                -
                menuHeight
                -
                12

            )

        )}px`;

}

function hideRelationshipMenu() {

    if (!relationshipMenu)
        return;

    relationshipMenu.classList.remove("is-visible");
    relationshipMenuPerson = null;

}

function traceRelationshipToFocus(person) {

    const path =

        findRelationshipPath(

            focusedPerson,

            person.id

        );

    if (!path)
        return;

    clearRelationshipTrace();

    const pathPeople = new Set(path.nodes);
    const pathConnections = new Set();

    relationshipTraceTerminals =

        new Set([

            String(path.nodes[0]),

            String(
                path.nodes[
                    path.nodes.length - 1
                ]
            )

        ]);

    relationshipTraceTerminalSize =

        Math.max(

            ...[
                ...relationshipTraceTerminals
            ].map(

                personId =>

                    focusedNodeSizes.get(personId)
                    ??
                    baseNodeRadius()

            )

        );

    for (
        let index = 1;
        index < path.nodes.length;
        index += 1
    ) {

        pathConnections.add(

            relationshipEdgeKey(

                path.nodes[index - 1],

                path.nodes[index]

            )

        );

    }

    nodeSelection.classed(

        "relationship-path-node",

        node =>
            pathPeople.has(String(node.id))

    );

    nodeSelection

        .filter(

            node =>
                relationshipTraceTerminals.has(
                    String(node.id)
                )

        )

        .interrupt()

        .attr(
            "r",
            relationshipTraceTerminalSize
        );

    labelSelection.classed(

        "relationship-path-label",

        node =>
            pathPeople.has(String(node.id))

    )

        .text(

            node =>

                pathPeople.has(String(node.id))

                ?

                (
                    node.name
                    ||
                    node.display_name
                )

                :

                (
                    isFocusedCoupleMember(node.id)

                    ?

                    (
                        node.name
                        ||
                        node.display_name
                    )

                    :

                    (
                        node.display_name
                        ||
                        node.name
                    )
                )

        );

    linkSelection.classed(

        "relationship-path-link",

        link =>
            pathConnections.has(

                relationshipEdgeKey(

                    link.source.id
                    ??
                    link.source,

                    link.target.id
                    ??
                    link.target

                )

            )

    );

}

function relationshipEdgeKey(firstId,secondId) {

    return [

        String(firstId),

        String(secondId)

    ]

    .sort()

    .join("::");

}

function clearRelationshipTrace() {

    if (nodeSelection) {

        nodeSelection

            .filter(

                node =>
                    relationshipTraceTerminals.has(
                        String(node.id)
                    )

            )

            .interrupt()

            .attr(

                "r",

                node =>

                    focusedNodeSizes.get(
                        String(node.id)
                    )

                    ??

                    baseNodeRadius()

            );

        nodeSelection.classed(
            "relationship-path-node",
            false
        );

    }

    relationshipTraceTerminals.clear();
    relationshipTraceTerminalSize = 0;

    if (labelSelection)
        labelSelection

            .classed(
                "relationship-path-label",
                false
            )

            .text(

                node =>

                    isFocusedCoupleMember(node.id)

                    ?

                    (
                        node.name
                        ||
                        node.display_name
                    )

                    :

                    (
                        node.display_name
                        ||
                        node.name
                    )

            );

    if (linkSelection)
        linkSelection.classed(
            "relationship-path-link",
            false
        );

}

function isTouchDevice() {

    return window.matchMedia(

        "(hover: none), (pointer: coarse)"

    ).matches;

}

function hideTooltip() {

    if (!tooltip)
        return;

    tooltipPersonId = null;

    tooltip.style("opacity",0);

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

        familyLayoutForViewport().zoom

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

            const navigationGuide =

                document.getElementById(
                    "navigation-guide"
                );

            if (
                navigationGuide
                &&
                !navigationGuide.hidden
            ) {

                document
                    .getElementById(
                        "navigation-close"
                    )
                    .click();

                return;

            }

            if (
                relationshipMenu
                &&
                relationshipMenu.classList.contains(
                    "is-visible"
                )
            ) {

                hideRelationshipMenu();

                return;

            }

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

    hideRelationshipMenu();
    clearRelationshipTrace();

    focusedPerson=null;

    focusedNodeSizes.clear();

    familyLayoutTargets.clear();

    simulation

        .force("family-x", null)

        .force("family-y", null)

        .force(

            "collision",

            d3.forceCollide()

                .radius(nodeLabelCollisionRadius)

                .iterations(2)

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

        .attr("r",baseNodeRadius())

        .attr("opacity",STAR.opacity);

    labelSelection

        .text(

            d =>

                d.display_name
                ||
                d.name

        )

        .transition()

        .style(

            "font-size",

            `${globalLabelSize()}px`

        )

        .style("opacity",.62);

    linkSelection

        .transition()

        .style("opacity",0.12);

}

//
// ------------------------------------------------------------
// END
// ------------------------------------------------------------
//

console.log(

    "Universe Mode 2 loaded."

);
