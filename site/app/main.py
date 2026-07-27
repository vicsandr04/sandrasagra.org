from flask import Flask, jsonify, send_from_directory

from graph import build_graph
from relationships import FamilyGraph

app = Flask(__name__)


#
# Home page
#

@app.route("/")
def index():

    return send_from_directory(
        "static",
        "index.html"
    )


#
# Complete graph
#

@app.route("/graph.json")
def graph():

    return jsonify(
        build_graph()
    )


#
# Family information
#

@app.route("/api/family/<person_id>")
def family(person_id):

    graph_data = build_graph()

    family_graph = FamilyGraph(
        graph_data
    )

    person = family_graph.people(
        [person_id]
    )

    if not person:

        return jsonify({
            "error": "Person not found"
        }), 404

    return jsonify({

        "person": person[0],

        "parents":
            family_graph.people(
                family_graph.get_parents(person_id)
            ),

        "children":
            family_graph.people(
                family_graph.get_children(person_id)
            ),

        "spouses":
            family_graph.people(
                family_graph.get_spouses(person_id)
            ),

        "siblings":
            family_graph.people(
                family_graph.get_siblings(person_id)
            ),

        "grandparents":
            family_graph.people(
                family_graph.get_grandparents(person_id)
            ),

        "aunts_uncles":
            family_graph.people(
                family_graph.get_aunts_uncles(person_id)
            ),

        "first_cousins":
            family_graph.people(
                family_graph.get_first_cousins(person_id)
            )

    })


#
# Network for D3 visualization
#

@app.route("/api/network/<person_id>")
def network(person_id):

    graph_data = build_graph()

    family = FamilyGraph(
        graph_data
    )

    if person_id not in family.nodes:

        return jsonify({
            "error": "Person not found"
        }), 404


    #
    # Get enriched nodes
    #

    nodes = family.network(
        person_id,
        degrees=4
    )


    #
    # Keep IDs
    #

    keep = {

        n["id"]

        for n in nodes

    }


    #
    # Keep only links inside returned network
    #

    links = []

    for link in graph_data["links"]:

        if (

            link["source"] in keep

            and

            link["target"] in keep

        ):

            links.append({

                "source":
                    link["source"],

                "target":
                    link["target"],

                "type":
                    link.get(
                        "type",
                        "family"
                    )

            })


    return jsonify({

        "focus":
            person_id,

        "nodes":
            nodes,

        "links":
            links

    })


#
# Specific relationship between two people
#

@app.route(
    "/api/relationship/<root_id>/<person_id>"
)
def relationship(root_id, person_id):

    graph_data = build_graph()

    family = FamilyGraph(graph_data)

    if (
        root_id not in family.nodes
        or
        person_id not in family.nodes
    ):

        return jsonify({
            "error": "Person not found"
        }), 404

    return jsonify({

        "focus": root_id,

        "person": person_id,

        "relationship":
            family.relationship(
                root_id,
                person_id
            )

    })


#
# Static files
#

@app.route("/<path:filename>")
def static_files(filename):

    return send_from_directory(
        "static",
        filename
    )


if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=8080,

        debug=True

    )
