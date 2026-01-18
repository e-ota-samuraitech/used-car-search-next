$SERVING_CONFIG="projects/83238378482/locations/global/collections/default_collection/engines/u-carsearch-search_1768717473698/servingConfigs/default_search"
$TOKEN=(gcloud auth print-access-token)

$URI="https://discoveryengine.googleapis.com/v1/$($SERVING_CONFIG):search"
$headers=@{
  Authorization="Bearer $TOKEN"
  "x-goog-user-project"="u-carsearch"
  "Content-Type"="application/json"
}

# makerSlug facet
$body=@"
{
  "query": "N-BOX",
  "filter": "makerSlug: ANY(\"honda\")",
  "pageSize": 5
}
"@
Invoke-RestMethod -Method Post -Uri $URI -Headers $headers -Body $body | ConvertTo-Json -Depth 6
