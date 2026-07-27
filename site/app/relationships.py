from collections import defaultdict, deque


class FamilyGraph:

    def __init__(self, graph):

        self.nodes = {
            n["id"]: n
            for n in graph["nodes"]
        }

        self.parents = defaultdict(set)
        self.children = defaultdict(set)
        self.spouses = defaultdict(set)

        self.graph = defaultdict(set)


        for link in graph["links"]:

            source = link["source"]
            target = link["target"]

            if link["type"] == "parent":

                self.parents[target].add(source)
                self.children[source].add(target)

                self.graph[source].add(target)
                self.graph[target].add(source)


            elif link["type"] == "spouse":

                self.spouses[source].add(target)
                self.spouses[target].add(source)

                self.graph[source].add(target)
                self.graph[target].add(source)



    #
    # Direct relationships
    #

    def get_parents(self, person):
        return self.parents[person]


    def get_children(self, person):
        return self.children[person]


    def get_spouses(self, person):
        return self.spouses[person]



    #
    # Siblings
    #

    def get_siblings(self, person):

        siblings=set()

        for parent in self.parents[person]:

            siblings.update(
                self.children[parent]
            )

        siblings.discard(person)

        return siblings



    #
    # Ancestors
    #

    def get_grandparents(self, person):

        result=set()

        for parent in self.parents[person]:

            result.update(
                self.parents[parent]
            )

        return result



    #
    # Aunts / Uncles
    #

    def get_aunts_uncles(self, person):

        result=set()

        for parent in self.parents[person]:

            result.update(
                self.get_siblings(parent)
            )

        return result



    #
    # Cousins
    #

    def get_first_cousins(self, person):

        result=set()

        for aunt in self.get_aunts_uncles(person):

            result.update(
                self.children[aunt]
            )

        return result



    #
    # Relationship classifier
    #

    def relationship(self, root, person):

        if root == person:
            return "self"



        if person in self.spouses[root]:
            return "spouse"



        if person in self.parents[root]:
            return "parent"



        if person in self.children[root]:
            return "child"



        if person in self.get_siblings(root):
            return "sibling"



        if person in self.get_grandparents(root):
            return "grandparent"



        if person in self.get_aunts_uncles(root):

            gender = self.nodes.get(
                person,
                {}
            ).get(
                "gender"
            )

            if gender == 1:
                return "uncle"

            return "aunt"



        if person in self.get_first_cousins(root):
            return "cousin"



        #
        # fallback ancestor search
        #

        ancestors = self.parents[root]

        visited=set()

        queue=deque(
            [
                (a,1)
                for a in ancestors
            ]
        )


        while queue:

            current,depth = queue.popleft()


            if current == person:

                if depth == 1:
                    return "parent"

                if depth == 2:
                    return "grandparent"

                return "ancestor"


            if current not in visited:

                visited.add(current)

                for p in self.parents[current]:

                    queue.append(
                        (
                            p,
                            depth+1
                        )
                    )


        return "relative"



    #
    # Network traversal
    #

    def get_network(self, person, degrees=4):

        visited={person}

        queue=deque(
            [
                (person,0)
            ]
        )


        result=[]


        while queue:

            current,depth = queue.popleft()


            result.append({

                "id":current,

                "degree":depth,

                "relationship":
                    self.relationship(
                        person,
                        current
                    )

            })


            if depth >= degrees:
                continue



            neighbours=set()


            neighbours |= self.parents[current]
            neighbours |= self.children[current]
            neighbours |= self.spouses[current]
            neighbours |= self.get_siblings(current)



            for neighbour in neighbours:

                if neighbour not in visited:

                    visited.add(neighbour)

                    queue.append(
                        (
                            neighbour,
                            depth+1
                        )
                    )


        return result



    #
    # Person lookup
    #

    def people(self, ids):

        return [
            self.nodes[i]
            for i in ids
            if i in self.nodes
        ]



    #
    # Complete network
    #

    def network(self, person, degrees=4):

        result=[]


        for entry in self.get_network(
            person,
            degrees
        ):


            data=dict(
                self.nodes[
                    entry["id"]
                ]
            )


            data["degree"] = entry["degree"]

            data["relationship"] = (
                entry["relationship"]
            )


            result.append(data)


        return result
