import sys
import unittest
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(APP_ROOT))

from graph import extract_person_names


class PersonNameTests(unittest.TestCase):

    def test_extracts_searchable_nicknames_and_alternate_names(self):

        names = extract_person_names({
            "primary_name": {
                "call": "Vic",
                "nick": "Vicky",
                "famnick": "Vic",
                "private": False,
            },
            "alternate_names": [
                {
                    "first_name": "Victor",
                    "surname_list": [
                        {
                            "surname": "Sandrasagra",
                        },
                    ],
                    "suffix": "",
                    "call": "V",
                    "nick": "Vico",
                    "famnick": "",
                    "private": False,
                },
            ],
        })

        self.assertEqual(
            names["nicknames"],
            ["Vic", "Vicky", "V", "Vico"],
        )
        self.assertEqual(
            names["alternate_names"],
            ["Victor Sandrasagra", "Victor"],
        )
        self.assertEqual(
            names["search_names"],
            [
                "Vic",
                "Vicky",
                "V",
                "Vico",
                "Victor Sandrasagra",
                "Victor",
            ],
        )

    def test_excludes_private_name_records(self):

        names = extract_person_names({
            "primary_name": {
                "nick": "Private nickname",
                "private": True,
            },
            "alternate_names": [
                {
                    "first_name": "Private alternate",
                    "nick": "Hidden",
                    "private": True,
                },
            ],
        })

        self.assertEqual(names["nicknames"], [])
        self.assertEqual(names["alternate_names"], [])
        self.assertEqual(names["search_names"], [])


if __name__ == "__main__":
    unittest.main()
