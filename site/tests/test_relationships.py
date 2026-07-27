import sys
import unittest
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(APP_ROOT))

from relationships import FamilyGraph


def person(person_id, gender=2):
    return {
        "id": person_id,
        "name": person_id,
        "display_name": person_id,
        "gender": gender,
    }


def parent(source, target):
    return {
        "source": source,
        "target": target,
        "type": "parent",
    }


def spouse(first, second):
    return {
        "source": first,
        "target": second,
        "type": "spouse",
    }


class RelationshipTests(unittest.TestCase):

    def setUp(self):
        people = [
            person("root", 1),
            person("father", 1),
            person("mother", 0),
            person("sister", 0),
            person("daughter", 0),
            person("grandfather", 1),
            person("grandmother", 0),
            person("aunt", 0),
            person("cousin", 1),
            person("cousin_child", 0),
            person("wife", 0),
            person("common"),
            person("r1"),
            person("r2"),
            person("r3"),
            person("t1"),
            person("t2"),
            person("t3"),
            person("third_cousin"),
            person("removed1"),
            person("removed2"),
            person("outsider"),
            person("outsider_spouse"),
        ]

        links = [
            parent("father", "root"),
            parent("mother", "root"),
            parent("father", "sister"),
            parent("mother", "sister"),
            parent("root", "daughter"),
            parent("grandfather", "father"),
            parent("grandmother", "father"),
            parent("grandfather", "aunt"),
            parent("grandmother", "aunt"),
            parent("aunt", "cousin"),
            parent("cousin", "cousin_child"),
            spouse("root", "wife"),
            parent("common", "r3"),
            parent("r3", "r2"),
            parent("r2", "r1"),
            parent("r1", "root"),
            parent("common", "t3"),
            parent("t3", "t2"),
            parent("t2", "t1"),
            parent("t1", "third_cousin"),
            parent("third_cousin", "removed1"),
            parent("removed1", "removed2"),
            spouse("outsider", "outsider_spouse"),
        ]

        self.family = FamilyGraph({
            "nodes": people,
            "links": links,
        })

    def test_gendered_immediate_relationships(self):
        self.assertEqual(
            self.family.relationship("root", "father"),
            "father",
        )
        self.assertEqual(
            self.family.relationship("root", "mother"),
            "mother",
        )
        self.assertEqual(
            self.family.relationship("root", "sister"),
            "sister",
        )
        self.assertEqual(
            self.family.relationship("root", "daughter"),
            "daughter",
        )
        self.assertEqual(
            self.family.relationship("root", "wife"),
            "wife",
        )

    def test_extended_family_relationships(self):
        self.assertEqual(
            self.family.relationship("root", "grandfather"),
            "grandfather",
        )
        self.assertEqual(
            self.family.relationship("root", "grandmother"),
            "grandmother",
        )
        self.assertEqual(
            self.family.relationship("root", "aunt"),
            "aunt",
        )
        self.assertEqual(
            self.family.relationship("root", "cousin"),
            "1st cousin",
        )
        self.assertEqual(
            self.family.relationship("root", "cousin_child"),
            "1st cousin once removed",
        )

    def test_distant_cousins_and_removals(self):
        self.assertEqual(
            self.family.relationship("root", "third_cousin"),
            "3rd cousin",
        )
        self.assertEqual(
            self.family.relationship("root", "removed1"),
            "3rd cousin once removed",
        )
        self.assertEqual(
            self.family.relationship("root", "removed2"),
            "3rd cousin twice removed",
        )

    def test_unrelated_married_pair_does_not_recurse(self):
        self.assertEqual(
            self.family.relationship("root", "outsider"),
            "relative",
        )


if __name__ == "__main__":
    unittest.main()
