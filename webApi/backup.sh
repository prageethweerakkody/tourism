#!/bin/bash
mongodump --db spotlist --host 127.0.0.1 --gzip --archive=spotlist_dump.archive
git add spotlist_dump.archive
git commit -m "Updated database archive"
git push
