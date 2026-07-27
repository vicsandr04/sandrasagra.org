# SANDRASAGRA.ORG

The deployable application lives entirely in `site/`.

## Structure

- `site/app/main.py` — Flask routes
- `site/app/graph.py` — Gramps database graph builder
- `site/app/relationships.py` — kinship calculations
- `site/app/static/` — HTML, CSS, JavaScript, and `robots.txt`
- `site/tests/` — relationship tests
- `site/docker-compose.yml` — production service definition

The Gramps database and `.env` credentials are runtime resources and
must never be committed to this repository.

## Test

```bash
python3 -m unittest discover -s site/tests -v
node --check site/app/static/graph.js
```

## Deploy

Deploy the contents of `site/` to `/opt/lineage-portal/`, preserve the
server's `.env`, then rebuild the `lineage-portal` service.

