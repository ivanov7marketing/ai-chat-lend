#!/bin/bash
cd /opt/chatbot
docker compose exec -T postgres psql -U chatbot -d chatbot -c "SELECT subcategory, count(*) FROM work_types WHERE category='Демонтажные работы' GROUP BY subcategory ORDER BY subcategory;"
