while read -r line; do
    action=${line%%:*}
    filename=${line#*:}

    if [[ $action == modify && $filename == *data.db* ]]; then
        cd ../portfolio-strapi
        bash generate-static-api.sh
    # else
        # echo "No action taken for $filename"
    fi
done