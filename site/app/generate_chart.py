import requests
import networkx as nx
import matplotlib
import os

matplotlib.use("Agg")

import matplotlib.pyplot as plt


API = "https://lineage.sandrasagra.org/api"

USERNAME = os.environ.get("GRAMPS_USERNAME")

if not USERNAME:
    raise RuntimeError("GRAMPS_USERNAME is not configured")

PASSWORD = os.environ.get("GRAMPS_PASSWORD")

if not PASSWORD:
    raise RuntimeError("GRAMPS_PASSWORD is not configured")

OUTPUT = "/app/static/family-chart.png"


def get_token():

    response = requests.post(
        API + "/token/",
        json={
            "username": USERNAME,
            "password": PASSWORD
        }
    )

    response.raise_for_status()

    return response.json()["access_token"]


def get_people(token):

    response = requests.get(
        API + "/people/",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    response.raise_for_status()

    return response.json()


def person_name(person):

    first = person["primary_name"].get(
        "first_name",
        ""
    )

    surname = ""

    surnames = person["primary_name"].get(
        "surname_list",
        []
    )

    if surnames:
        surname = surnames[0].get(
            "surname",
            ""
        )

    return f"{first} {surname}".strip()


def build_graph(people):

    graph = nx.Graph()

    names = {}

    for person in people:

        handle = person["handle"]

        names[handle] = person_name(person)

        graph.add_node(handle)


    # placeholder family relationships
    # next version will use /families endpoint

    return graph, names


def render(graph, names):

    plt.figure(
        figsize=(16,9),
        dpi=150
    )

    pos = nx.spring_layout(
        graph,
        k=1,
        iterations=50
    )

    nx.draw(
        graph,
        pos,
        labels=names,
        node_size=1200,
        font_size=8
    )

    plt.axis("off")

    plt.savefig(
        OUTPUT,
        bbox_inches="tight"
    )

    plt.close()


if __name__ == "__main__":

    token = get_token()

    people = get_people(token)

    print("People found:", len(people))

    graph, names = build_graph(
        people
    )

    render(
        graph,
        names
    )

    print(
        "Created:",
        OUTPUT
    )
