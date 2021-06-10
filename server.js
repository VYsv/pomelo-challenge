'use strict'

const Hapi = require('@hapi/hapi')
const init = async() => {
    const server = Hapi.server({
        host: 'localhost',
        port: 8000
    });

    server.route({
        method: 'POST',
        path: '/pomelo',
        handler: (request, h) => {
            const payload = request.payload
            var result = []
            var payloadKeys = Object.keys(payload);
            var parentMap = {}
            for (let lvl = payloadKeys.length - 1; lvl > -1; lvl--){
                payload[lvl].forEach((ind) => {
                    if (ind["level"] == payloadKeys.length - 1){
                        if (parentMap[ind["parent_id"]]){
                            parentMap[ind["parent_id"]].push(ind)
                        }
                        else{
                            parentMap[ind["parent_id"]] = [ind]
                        }
                    } else if (ind["level"] > 0){
                        if (parentMap[ind["id"]]){
                            ind["children"] = parentMap[ind["id"]]
                        }
                        if (parentMap[ind["parent_id"]]){
                            parentMap[ind["parent_id"]].push(ind)
                        }
                        else{
                            parentMap[ind["parent_id"]] = [ind]
                        }
                    } else{
                        if (parentMap[ind["id"]]){
                            ind["children"] = parentMap[ind["id"]]
                        }
                        result.push(ind)
                    }
                })
            }
            return result
        }   
    });

    await server.start()
    console.log(`Server started on: ${server.info.uri}`)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()