#!/bin/bash

echo
echo '| Complete | Language |'
echo '|-------|---|'

for langfile in $(ls src/langs/??.tsx); do
    translated=$(grep --count "translated: true" "$langfile")
    total=$(grep --count "translated: " "$langfile")
    if [ "$langfile" = "src/langs/en.tsx" ]; then
        percent="100"
    elif [ "$total" -eq 0 ]; then
        percent="100"
    else
        percent=$(python -c "print('%d' % ($translated * 100 / ${total}.0))")
    fi
    langname=$(egrep "^  name:" "$langfile" | cut -d"'" -f2)
    echo '|' "$(printf "%4s" ${percent})%" '|' $langname '|'
done
echo ""
