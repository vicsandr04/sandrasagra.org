import sqlite3
import json
from pathlib import Path


# =====================================================
# CONFIGURATION
# =====================================================

GRAMPS_ROOT = Path("/grampsdb")


# =====================================================
# DATABASE FINDER
# =====================================================

def find_database():

    databases = list(
        GRAMPS_ROOT.rglob("sqlite.db")
    )

    if not databases:
        raise RuntimeError(
            "No Gramps database found"
        )

    #
    # Prefer main tree database
    #
    for db in databases:

        if (
            db.parent.name
            ==
            "42a4ceea-79b3-4c15-a4cc-0c8b514018ab"
        ):
            return db


    return max(
        databases,
        key=lambda x:x.stat().st_mtime
    )


# =====================================================
# DISPLAY NAME
# =====================================================

def display_name(full_name):

    parts = full_name.split()

    if len(parts)<=2:
        return full_name

    #
    # First + last only
    #

    return (
        parts[0]
        +
        " "
        +
        parts[-1]
    )


def _unique_names(values):

    result = []
    seen = set()

    for value in values:

        if not isinstance(value, str):
            continue

        value = " ".join(value.split())

        if not value:
            continue

        key = value.casefold()

        if key in seen:
            continue

        seen.add(key)
        result.append(value)

    return result


def _alternate_full_name(name):

    surnames = [

        surname.get("surname", "")

        for surname in (
            name.get(
                "surname_list",
                []
            )
            or
            []
        )

        if isinstance(surname, dict)

    ]

    return " ".join(

        part

        for part in [
            name.get("first_name", ""),
            *surnames,
            name.get("suffix", ""),
        ]

        if isinstance(part, str)
        and part.strip()

    )


def extract_person_names(data):

    nickname_values = []
    alternate_values = []

    primary_name = data.get(
        "primary_name",
        {}
    )

    if (
        isinstance(primary_name, dict)
        and
        not primary_name.get("private")
    ):

        nickname_values.extend([
            primary_name.get("call"),
            primary_name.get("nick"),
            primary_name.get("famnick"),
        ])

    alternate_names = (
        data.get(
            "alternate_names",
            []
        )
        or
        []
    )

    if not isinstance(alternate_names, list):
        alternate_names = []

    for alternate_name in alternate_names:

        if (
            not isinstance(alternate_name, dict)
            or
            alternate_name.get("private")
        ):
            continue

        alternate_values.extend([
            _alternate_full_name(alternate_name),
            alternate_name.get("first_name"),
        ])

        nickname_values.extend([
            alternate_name.get("call"),
            alternate_name.get("nick"),
            alternate_name.get("famnick"),
        ])

    nicknames = _unique_names(
        nickname_values
    )

    alternate_names = _unique_names(
        alternate_values
    )

    return {
        "nicknames": nicknames,
        "alternate_names": alternate_names,
        "search_names": _unique_names([
            *nicknames,
            *alternate_names,
        ]),
    }


# =====================================================
# LOAD PEOPLE
# =====================================================

def load_people(conn):

    people={}


    cursor=conn.cursor()


    rows=cursor.execute(
        """
        SELECT
            handle,
            given_name,
            surname,
            gramps_id,
            gender,
            json_data
        FROM person
        """
    )


    for row in rows:


        handle=row[0]

        given=row[1] or ""

        surname=row[2] or ""


        full_name=(
            given
            +
            " "
            +
            surname
        ).strip()



        data={}


        try:

            data=json.loads(
                row[5]
            )

        except:

            pass

        additional_names = (
            extract_person_names(data)
        )

        people[handle]={

            "id":
                handle,


            "gramps_id":
                row[3]
                or "",


            "name":
                full_name,


            "display_name":
                display_name(
                    full_name
                ),

            **additional_names,


            "gender":
                (
                    row[4]
                    if row[4] is not None
                    else 2
                ),


            "birth":
                None,


            "death":
                None,


            "photo":
                None

        }


    return people



# =====================================================
# LOAD FAMILIES
# =====================================================

def load_families(conn):

    families=[]

    cursor=conn.cursor()


    for row in cursor.execute(
        """
        SELECT
            json_data
        FROM family
        """
    ):

        try:

            families.append(
                json.loads(row[0])
            )

        except:

            pass


    return families



# =====================================================
# BUILD GRAPH
# =====================================================

def build_graph():

    db=find_database()


    conn=sqlite3.connect(
        str(db)
    )


    people=load_people(
        conn
    )


    families=load_families(
        conn
    )


    links=[]


    #
    # Build family relationships
    #

    for family in families:


        father=family.get(
            "father_handle"
        )

        mother=family.get(
            "mother_handle"
        )


        children=family.get(
            "child_ref_list",
            []
        )


        if father and mother:

            links.append({

                "source":father,

                "target":mother,

                "type":"spouse"

            })


        parents=[]


        if father:
            parents.append(
                father
            )

        if mother:
            parents.append(
                mother
            )


        for child in children:


            if isinstance(
                child,
                dict
            ):

                child=child.get(
                    "ref"
                )


            if not child:
                continue



            for parent in parents:


                links.append({

                    "source":
                        parent,

                    "target":
                        child,

                    "type":
                        "parent"

                })


    conn.close()


    return {

        "nodes":
            list(
                people.values()
            ),

        "links":
            links

    }


# =====================================================
# JSON EXPORT
# =====================================================

if __name__=="__main__":

    print(
        json.dumps(
            build_graph(),
            indent=2
        )
    )
