for n in $(kubectl get -n cloudlets -o=name deployment)
do
    kubectl -n cloudlets scale deployment "${n/deployment.apps\//}" --replicas 0
    sleep 15
    # I don't know if this works, as in if it may delete used volumes, so I've commented it out for now.
    # kubectl delete volumeattachment --all
    kubectl set image deployment/"${n/deployment.apps\//}" "${n/deployment.apps\//}"=servergardens/magic-backend:v19.11.2 --namespace=cloudlets
    kubectl -n cloudlets scale deployment "${n/deployment.apps\//}" --replicas 1
    sleep 20
done
