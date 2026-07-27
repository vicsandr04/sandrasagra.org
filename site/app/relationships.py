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
        self._ancestor_cache = {}


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

    def relationship(
        self,
        root,
        person,
        include_marriage=True
    ):

        if (
            root not in self.nodes
            or
            person not in self.nodes
        ):
            return "unknown relative"

        if root == person:
            return "self"

        if person in self.spouses[root]:
            return self._gendered(
                person,
                "husband",
                "wife",
                "spouse"
            )

        root_ancestors = self.ancestor_distances(
            root
        )

        person_ancestors = self.ancestor_distances(
            person
        )

        common = (
            set(root_ancestors)
            &
            set(person_ancestors)
        )

        if not common:

            if not include_marriage:
                return "relative"

            return self._relationship_by_marriage(
                root,
                person
            )

        ancestor = min(
            common,
            key=lambda candidate: (
                root_ancestors[candidate]
                +
                person_ancestors[candidate],
                max(
                    root_ancestors[candidate],
                    person_ancestors[candidate]
                ),
                candidate
            )
        )

        generations_up = root_ancestors[ancestor]
        generations_down = person_ancestors[ancestor]

        if generations_down == 0:
            return self._ancestor_name(
                person,
                generations_up
            )

        if generations_up == 0:
            return self._descendant_name(
                person,
                generations_down
            )

        if (
            generations_up == 1
            and
            generations_down == 1
        ):
            return self._gendered(
                person,
                "brother",
                "sister",
                "sibling"
            )

        if generations_down == 1:
            return self._aunt_uncle_name(
                person,
                generations_up
            )

        if generations_up == 1:
            return self._niece_nephew_name(
                person,
                generations_down
            )

        cousin_degree = (
            min(
                generations_up,
                generations_down
            )
            -
            1
        )

        removed = abs(
            generations_up
            -
            generations_down
        )

        relationship = (
            f"{self._ordinal(cousin_degree)} cousin"
        )

        if removed == 1:
            relationship += " once removed"
        elif removed == 2:
            relationship += " twice removed"
        elif removed > 2:
            relationship += (
                f" {removed} times removed"
            )

        return relationship


    def ancestor_distances(self, person):

        if person in self._ancestor_cache:
            return self._ancestor_cache[person]

        distances = {person: 0}
        queue = deque([person])

        while queue:

            current = queue.popleft()
            next_distance = distances[current] + 1

            for parent in self.parents[current]:

                if (
                    parent in distances
                    and
                    distances[parent] <= next_distance
                ):
                    continue

                distances[parent] = next_distance
                queue.append(parent)

        self._ancestor_cache[person] = distances

        return distances


    def _gendered(
        self,
        person,
        male,
        female,
        neutral
    ):

        gender = self.nodes.get(
            person,
            {}
        ).get("gender")

        if gender == 1:
            return male

        if gender == 0:
            return female

        return neutral


    def _ancestor_name(self, person, depth):

        if depth == 1:
            return self._gendered(
                person,
                "father",
                "mother",
                "parent"
            )

        if depth == 2:
            return self._gendered(
                person,
                "grandfather",
                "grandmother",
                "grandparent"
            )

        prefix = "great-" * (depth - 2)

        return self._gendered(
            person,
            f"{prefix}grandfather",
            f"{prefix}grandmother",
            f"{prefix}grandparent"
        )


    def _descendant_name(self, person, depth):

        if depth == 1:
            return self._gendered(
                person,
                "son",
                "daughter",
                "child"
            )

        if depth == 2:
            return self._gendered(
                person,
                "grandson",
                "granddaughter",
                "grandchild"
            )

        prefix = "great-" * (depth - 2)

        return self._gendered(
            person,
            f"{prefix}grandson",
            f"{prefix}granddaughter",
            f"{prefix}grandchild"
        )


    def _aunt_uncle_name(self, person, depth):

        if depth == 2:
            return self._gendered(
                person,
                "uncle",
                "aunt",
                "parent's sibling"
            )

        if depth == 3:
            prefix = "grand"
        else:
            prefix = (
                "great-" * (depth - 3)
                +
                "grand"
            )

        return self._gendered(
            person,
            f"{prefix}uncle",
            f"{prefix}aunt",
            f"{prefix}parent's sibling"
        )


    def _niece_nephew_name(self, person, depth):

        if depth == 2:
            return self._gendered(
                person,
                "nephew",
                "niece",
                "sibling's child"
            )

        if depth == 3:
            prefix = "grand"
        else:
            prefix = (
                "great-" * (depth - 3)
                +
                "grand"
            )

        return self._gendered(
            person,
            f"{prefix}nephew",
            f"{prefix}niece",
            f"{prefix}sibling's descendant"
        )


    def _relationship_by_marriage(
        self,
        root,
        person
    ):

        for spouse in self.spouses[person]:

            blood_relationship = self.relationship(
                root,
                spouse,
                include_marriage=False
            )

            if blood_relationship not in (
                "relative",
                "relative by marriage",
                "unknown relative"
            ):

                relationship = (
                    self._regender_relationship(
                        blood_relationship,
                        person
                    )
                )

                return (
                    f"{relationship} by marriage"
                )

        return "relative"


    def _regender_relationship(
        self,
        relationship,
        person
    ):

        gendered_terms = [
            (
                "grandfather",
                "grandmother",
                "grandparent"
            ),
            (
                "grandson",
                "granddaughter",
                "grandchild"
            ),
            (
                "father",
                "mother",
                "parent"
            ),
            (
                "son",
                "daughter",
                "child"
            ),
            (
                "brother",
                "sister",
                "sibling"
            ),
            (
                "uncle",
                "aunt",
                "parent's sibling"
            ),
            (
                "nephew",
                "niece",
                "sibling's descendant"
            )
        ]

        for male, female, neutral in gendered_terms:

            matched_term = None

            if relationship.endswith(male):
                matched_term = male
            elif relationship.endswith(female):
                matched_term = female
            elif relationship.endswith(neutral):
                matched_term = neutral

            if not matched_term:
                continue

            prefix = relationship[
                :-len(matched_term)
            ]

            return (
                prefix
                +
                self._gendered(
                    person,
                    male,
                    female,
                    neutral
                )
            )

        return relationship


    @staticmethod
    def _ordinal(number):

        if 10 <= number % 100 <= 20:
            suffix = "th"
        else:
            suffix = {
                1: "st",
                2: "nd",
                3: "rd"
            }.get(number % 10, "th")

        return f"{number}{suffix}"



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
