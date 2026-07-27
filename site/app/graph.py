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
